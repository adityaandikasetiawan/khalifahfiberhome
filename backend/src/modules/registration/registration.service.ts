import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { Customer } from "../customers/entities/customer.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";
import { Package } from "../packages/entities/package.entity";
import { Invoice } from "../invoices/entities/invoice.entity";
import { InvoiceItem } from "../invoices/entities/invoice-item.entity";
import { EmailService } from "../notifications/email.service";
import { MikrotikService } from "../mikrotik/mikrotik.service";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { renderBrandedEmail, BrandInfo } from "../notifications/email-template";
import { RegisterDto } from "./dto/register.dto";
import { ApproveRegistrationDto } from "./dto/approve-registration.dto";

/**
 * Registrasi pelanggan baru (self-service):
 *   1. register()  -> buat Customer (pending_verification) + Subscription
 *                     (pending_activation) + kirim email verifikasi Brevo.
 *   2. verifyEmail() -> tandai email terverifikasi, buat invoice biaya
 *                       registrasi (= harga paket), kembalikan info invoice.
 *   3. Pelanggan bayar invoice lewat portal. Setelah lunas, customer jadi
 *      pending_active (menunggu approval teknisi) — TIDAK auto-enable PPPoE.
 */
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Package) private readonly packageRepo: Repository<Package>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private readonly itemRepo: Repository<InvoiceItem>,
    @InjectRepository(SiteSetting) private readonly settingRepo: Repository<SiteSetting>,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly mikrotikService: MikrotikService,
  ) {}

  /** Daftar registrasi yang menunggu approval teknisi (customer pending_active). */
  async listPendingApprovals() {
    const subs = await this.subscriptionRepo
      .createQueryBuilder("sub")
      .leftJoinAndSelect("sub.package", "package")
      .leftJoinAndSelect("sub.customer", "customer")
      .where("sub.status = :status", { status: "pending_activation" })
      .orderBy("sub.createdAt", "ASC")
      .getMany();

    return subs.map((s: any) => ({
      subscriptionId: s.id,
      customerId: s.customer?.id,
      customerNumber: s.customer?.customerNumber,
      name: s.customer?.name,
      phone: s.customer?.phone,
      email: s.customer?.email,
      address: s.customer?.address,
      customerStatus: s.customer?.status,
      package: s.package ? { name: s.package.name, speedMbps: s.package.speedMbps, price: Number(s.package.price) } : null,
    }));
  }

  /**
   * APPROVAL TEKNISI untuk pelanggan baru: setelah pembayaran registrasi lunas
   * dan pemasangan fisik selesai, teknisi meng-approve. Baru saat ini:
   *   - PPPoE secret dibuat di router + di-enable,
   *   - subscription -> active, customer -> active, isNewRegistration -> false.
   */
  async approveRegistration(subscriptionId: string, dto: ApproveRegistrationDto) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: ["customer", "package"],
    });
    if (!subscription) throw new NotFoundException("Langganan tidak ditemukan");
    if (subscription.status === "active") {
      throw new BadRequestException("Langganan sudah aktif");
    }

    const customer = (subscription as any).customer as Customer;

    // Default: wajib invoice registrasi sudah lunas sebelum approve.
    const requirePaid = dto.requirePaid !== false;
    if (requirePaid) {
      const paid = await this.invoiceRepo.findOne({
        where: { subscriptionId: subscription.id, status: "paid" as any },
      });
      if (!paid) {
        throw new BadRequestException(
          "Invoice registrasi belum lunas. Approve ditolak (set requirePaid=false untuk memaksa).",
        );
      }
    }

    // Buat & enable PPPoE di router
    const profile = dto.mikrotikProfile || (subscription as any).package?.name || "default";
    const password = dto.pppoePassword || dto.pppoeUsername;
    const created = await this.mikrotikService.createPppoeAccount(
      dto.routerId,
      dto.pppoeUsername,
      password,
      profile,
    );
    if (!created) {
      throw new BadRequestException(
        "Gagal membuat akun PPPoE di router. Pastikan router aktif & terjangkau, lalu coba lagi.",
      );
    }
    // Pastikan enabled (createPppoeSecret membuat enabled secara default)
    await this.mikrotikService.activatePppoe(dto.routerId, dto.pppoeUsername);

    // Update subscription -> active + isi data router
    subscription.status = "active";
    subscription.routerId = dto.routerId;
    subscription.pppoeUsername = dto.pppoeUsername;
    subscription.mikrotikProfile = profile;
    await this.subscriptionRepo.save(subscription);

    // Update customer -> active + tandai bukan pendaftar baru lagi
    if (customer) {
      await this.customerRepo
        .createQueryBuilder()
        .update(Customer)
        .set({ status: "active", isNewRegistration: false })
        .where("id = :id", { id: customer.id })
        .execute();
    }

    this.logger.log(
      `Registrasi ${customer?.customerNumber} di-APPROVE: PPPoE ${dto.pppoeUsername} dibuat & aktif di router ${dto.routerId}`,
    );

    return {
      message: "Pelanggan diaktifkan. Akun PPPoE dibuat dan layanan aktif.",
      subscriptionId: subscription.id,
      pppoeUsername: dto.pppoeUsername,
      status: "active",
    };
  }

  /** Daftar paket aktif untuk ditampilkan di form registrasi publik. */
  async listPackages() {
    const packages = await this.packageRepo.find({ where: { isActive: true }, order: { price: "ASC" } });
    return packages.map((p) => ({
      id: p.id,
      name: p.name,
      // Deskripsi tampil ke pelanggan (mengganti angka kecepatan).
      displayDesc: p.displayDesc || "Cocok untuk beberapa perangkat",
      price: Number(p.price),
      billingCycle: p.billingCycle,
    }));
  }

  private normalizePhone(phone: string): string {
    let p = phone.replace(/[^0-9]/g, "");
    if (p.startsWith("0")) p = "62" + p.slice(1);
    return p;
  }

  private async generateCustomerNumber(): Promise<string> {
    const last = await this.customerRepo
      .createQueryBuilder("c")
      .where("c.customerNumber LIKE :prefix", { prefix: "KHA-%" })
      .orderBy("LENGTH(c.customerNumber)", "DESC")
      .addOrderBy("c.customerNumber", "DESC")
      .getOne();
    let next = 1;
    if (last?.customerNumber) {
      const n = parseInt(last.customerNumber.replace(/\D/g, ""), 10);
      if (!isNaN(n)) next = n + 1;
    }
    const candidate = `KHA-${String(next).padStart(3, "0")}`;
    const clash = await this.customerRepo.findOne({ where: { customerNumber: candidate } });
    return clash ? `KHA-${Date.now().toString().slice(-6)}` : candidate;
  }

  async register(dto: RegisterDto) {
    const phone = this.normalizePhone(dto.phone);

    // Cegah duplikasi: kalau nomor/email sudah jadi pelanggan aktif, tolak.
    const existingByPhone = await this.customerRepo.findOne({ where: { phone } });
    if (existingByPhone && existingByPhone.status === "active") {
      throw new BadRequestException("Nomor ini sudah terdaftar sebagai pelanggan aktif. Silakan login ke portal.");
    }

    const pkg = await this.packageRepo.findOne({ where: { id: dto.packageId, isActive: true } });
    if (!pkg) throw new BadRequestException("Paket yang dipilih tidak tersedia");

    const token = crypto.randomBytes(24).toString("hex");
    const customerNumber = await this.generateCustomerNumber();

    // Buat / perbarui customer sebagai pendaftar baru
    const customer = existingByPhone ?? this.customerRepo.create({ customerNumber });
    customer.name = dto.fullName;
    customer.phone = phone;
    customer.email = dto.email;
    customer.address = dto.address;
    customer.nik = dto.nik;
    customer.status = "pending_verification";
    customer.isNewRegistration = true;
    customer.emailVerificationToken = token;
    customer.emailVerifiedAt = undefined;
    // Password diisi saat registrasi -> hash bcrypt. Setelah verifikasi email,
    // pelanggan langsung bisa login email+password.
    customer.password = await bcrypt.hash((dto.password ?? "").trim(), 10);
    customer.passwordSetAt = new Date();
    const savedCustomer = await this.customerRepo.save(customer);

    // Buat subscription pending_activation dengan paket pilihan
    const today = new Date();
    const billingDay = Math.min(Math.max(today.getDate(), 1), 28);
    const subscription = await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        customerId: savedCustomer.id,
        packageId: pkg.id,
        startDate: today.toISOString().slice(0, 10) as any,
        billingDay,
        status: "pending_activation",
        mikrotikProfile: undefined,
      }),
    );

    // Kirim email verifikasi
    const baseUrl = this.config.get("PORTAL_BASE_URL", "https://khalifahfiberhome.my.id/portal");
    const verifyUrl = `${baseUrl}/verifikasi?token=${token}`;
    await this.sendVerificationEmail(dto.email, dto.fullName, verifyUrl, {
      name: pkg.name,
      price: Number(pkg.price),
    });

    this.logger.log(`Registrasi baru: ${savedCustomer.customerNumber} (${dto.email}), paket ${pkg.name}`);
    return {
      message: "Registrasi berhasil. Silakan cek email Anda untuk verifikasi.",
      customerId: savedCustomer.id,
      subscriptionId: subscription.id,
      email: dto.email,
    };
  }

  private async getBrand(): Promise<BrandInfo> {
    let company: any = {};
    try {
      const s = await this.settingRepo.findOne({ where: { key: "company" } });
      company = s?.value ?? {};
    } catch {
      /* fallback */
    }
    return {
      name: company.name || "Khalifah Fiber Home",
      tagline: company.tagline,
      phone: company.phone,
      whatsapp: company.whatsapp,
      address: company.address,
      email: company.email,
      logoUrl: this.config.get("EMAIL_LOGO_URL") || undefined,
    };
  }

  private async sendVerificationEmail(email: string, name: string, verifyUrl: string, pkg?: { name: string; price: number }) {
    const brand = await this.getBrand();
    const html = renderBrandedEmail(brand, {
      greetingName: name,
      heading: "Verifikasi Email",
      accent: "#2563eb",
      emoji: "📧",
      intro:
        "Terima kasih telah mendaftar. Satu langkah lagi — mohon verifikasi alamat email Anda untuk melanjutkan ke pembayaran registrasi.",
      rows: pkg
        ? [
            { label: "Paket Dipilih", value: pkg.name },
            { label: "Biaya Registrasi", value: `Rp ${Number(pkg.price).toLocaleString("id-ID")}`, strong: true },
          ]
        : undefined,
      buttonText: "Verifikasi Email Saya",
      buttonUrl: verifyUrl,
      note: `Jika tombol tidak berfungsi, buka tautan ini: ${verifyUrl}`,
    });
    try {
      await this.emailService.sendEmail({
        to: email,
        toName: name,
        subject: `Verifikasi email pendaftaran - ${brand.name}`,
        htmlContent: html,
      });
    } catch (err) {
      this.logger.error(`Gagal kirim email verifikasi ke ${email}`, err as Error);
      // tidak dilempar: registrasi tetap tercatat, verifikasi bisa dikirim ulang
    }
  }

  private generateInvoiceNumber(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${y}${m}-${rand}`;
  }

  /**
   * Verifikasi email via token. Menandai customer terverifikasi lalu membuat
   * invoice biaya registrasi (= harga paket). Idempoten: kalau sudah pernah
   * verifikasi, kembalikan invoice registrasi yang sudah ada.
   */
  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException("Token verifikasi tidak valid");

    // token kolom select:false -> harus di-select eksplisit
    const customer = await this.customerRepo
      .createQueryBuilder("c")
      .addSelect("c.emailVerificationToken")
      .where("c.emailVerificationToken = :token", { token })
      .getOne();

    if (!customer) throw new NotFoundException("Token verifikasi tidak ditemukan atau sudah digunakan");

    const subscription = await this.subscriptionRepo.findOne({
      where: { customerId: customer.id },
      order: { createdAt: "DESC" },
      relations: ["package"],
    });
    if (!subscription) throw new NotFoundException("Data langganan tidak ditemukan");

    const pkg = await this.packageRepo.findOne({ where: { id: subscription.packageId } });
    if (!pkg) throw new NotFoundException("Paket tidak ditemukan");

    // Tandai email terverifikasi (idempoten). Update eksplisit via query builder
    // karena kolom token bertanda select:false sehingga save() entity tidak
    // selalu mem-flush perubahan menjadi NULL.
    if (!customer.emailVerifiedAt) {
      await this.customerRepo
        .createQueryBuilder()
        .update(Customer)
        .set({ emailVerifiedAt: new Date(), emailVerificationToken: null as any })
        .where("id = :id", { id: customer.id })
        .execute();
    }

    // Cari / buat invoice biaya registrasi (= harga paket)
    let invoice = await this.invoiceRepo.findOne({
      where: { subscriptionId: subscription.id },
      order: { createdAt: "DESC" },
    });
    if (!invoice) {
      const now = new Date();
      const periodStart = now;
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(periodEnd.getDate() - 1);
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 7);

      const item = this.itemRepo.create({
        description: `Biaya registrasi & langganan bulan pertama - ${pkg.name}`,
        qty: 1,
        unitPrice: pkg.price,
        subtotal: pkg.price,
      });
      invoice = await this.invoiceRepo.save(
        this.invoiceRepo.create({
          invoiceNumber: this.generateInvoiceNumber(now),
          payToken: crypto.randomBytes(24).toString("hex"),
          subscriptionId: subscription.id,
          periodStart,
          periodEnd,
          amount: pkg.price,
          taxAmount: 0,
          totalAmount: pkg.price,
          dueDate,
          status: "unpaid",
          items: [item],
        }),
      );
      this.logger.log(`Invoice registrasi ${invoice.invoiceNumber} dibuat untuk ${customer.customerNumber}`);
    }

    return {
      message: "Email berhasil diverifikasi. Silakan login ke portal dan lakukan pembayaran registrasi.",
      customerNumber: customer.customerNumber,
      phone: customer.phone,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        status: invoice.status,
      },
      packageName: pkg.name,
    };
  }
}
