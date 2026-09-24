import { Injectable, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice } from "../invoices/entities/invoice.entity";
import { CustomersService } from "../customers/customers.service";
import { PaymentsService } from "../payments/payments.service";

/**
 * Service untuk endpoint yang diakses PELANGGAN sendiri lewat portal (bukan
 * admin). Setiap query WAJIB di-scope ke customerId dari JWT -- pelanggan
 * tidak boleh bisa melihat data pelanggan lain lewat manipulasi ID di URL.
 */
@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    private readonly customersService: CustomersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getProfile(customerId: string) {
    const customer = await this.customersService.findOne(customerId);

    // Ambil subscription aktif (kalau ada) beserta paketnya, supaya portal
    // bisa menampilkan "Paket Aktif" dengan benar.
    const activeSub = await this.invoiceRepo.manager
      .getRepository("Subscription")
      .createQueryBuilder("sub")
      .leftJoinAndSelect("sub.package", "package")
      .where("sub.customerId = :customerId", { customerId })
      .orderBy("sub.createdAt", "DESC")
      .getOne();

    const pkg = (activeSub as any)?.package;

    // Masa aktif = periodEnd dari invoice LUNAS terakhir
    const lastPaid = await this.invoiceRepo.findOne({
      where: { subscriptionId: (activeSub as any)?.id, status: "paid" as any },
      order: { periodEnd: "DESC" },
    });
    const activeUntil = lastPaid?.periodEnd ?? null;
    // Hitung sisa hari
    let daysRemaining: number | null = null;
    if (activeUntil) {
      const diff = new Date(activeUntil).getTime() - Date.now();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      id: customer.id,
      name: customer.name,
      customerNumber: customer.customerNumber,
      phone: customer.phone,
      email: (customer as any).email,
      address: (customer as any).address,
      status: (customer as any).status,
      subscriptionStatus: (activeSub as any)?.status ?? null,
      activeUntil,
      daysRemaining,
      package: pkg
        ? { name: pkg.name, desc: pkg.displayDesc || "Cocok untuk beberapa perangkat", price: Number(pkg.price) }
        : null,
      packageName: pkg?.name ?? null,
      // Deskripsi paket (mengganti angka kecepatan yang disembunyikan dari pelanggan).
      packageDesc: pkg ? (pkg.displayDesc || "Cocok untuk beberapa perangkat") : null,
    };
  }

  /**
   * Map entity invoice ke bentuk yang rapi & konsisten untuk frontend portal.
   * Penting: kolom desimal dari Postgres dikembalikan sebagai STRING oleh
   * TypeORM (mis. "250000.00"), jadi harus di-Number()-kan supaya frontend
   * bisa memanggil .toLocaleString() tanpa crash.
   */
  private mapInvoice(invoice: Invoice) {
    const fmtPeriod = (start?: Date, end?: Date) => {
      if (!start) return undefined;
      const d = new Date(start);
      return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    };

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.totalAmount ?? invoice.amount ?? 0),
      subtotal: Number(invoice.amount ?? 0),
      taxAmount: Number(invoice.taxAmount ?? 0),
      totalAmount: Number(invoice.totalAmount ?? 0),
      dueDate: invoice.dueDate,
      status: invoice.status,
      period: fmtPeriod((invoice as any).periodStart, (invoice as any).periodEnd),
      createdAt: invoice.createdAt,
      items: (invoice.items ?? []).map((it: any) => ({
        description: it.description,
        qty: it.qty,
        unitPrice: Number(it.unitPrice ?? 0),
        amount: Number(it.subtotal ?? it.unitPrice ?? 0),
      })),
    };
  }

  async getMyInvoices(customerId: string) {
    const invoices = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .leftJoinAndSelect("subscription.package", "package")
      .leftJoinAndSelect("invoice.items", "items")
      .where("customer.id = :customerId", { customerId })
      .orderBy("invoice.createdAt", "DESC")
      .getMany();

    return invoices.map((inv) => this.mapInvoice(inv));
  }

  async getMyInvoiceDetail(customerId: string, invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ["subscription", "subscription.customer", "subscription.package", "items", "payments"],
    });

    // Cegah pelanggan A membuka invoice pelanggan B lewat tebak-tebak ID di URL
    if (!invoice || invoice.subscription?.customer?.id !== customerId) {
      throw new ForbiddenException("Invoice tidak ditemukan atau bukan milik Anda");
    }

    return this.mapInvoice(invoice);
  }

  /**
   * Pelanggan memicu pembayaran lewat portal. Verifikasi kepemilikan invoice
   * DULU sebelum meneruskan ke PaymentsService.createTransaction.
   */
  /**
   * Cek status pembayaran invoice (fallback kalau webhook belum masuk).
   * Verifikasi kepemilikan dulu, baru minta PaymentsService cek ke iPaymu.
   */
  async checkPayment(customerId: string, invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ["subscription", "subscription.customer"],
    });
    if (!invoice || invoice.subscription?.customer?.id !== customerId) {
      throw new ForbiddenException("Invoice tidak ditemukan atau bukan milik Anda");
    }
    return this.paymentsService.checkPaymentStatus(invoiceId);
  }

  async payInvoice(customerId: string, invoiceId: string, paymentMethod: "va" | "qris" | "ewallet", paymentChannel?: string) {
    // Verifikasi kepemilikan (query langsung, bukan lewat mapInvoice)
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ["subscription", "subscription.customer"],
    });
    if (!invoice || invoice.subscription?.customer?.id !== customerId) {
      throw new ForbiddenException("Invoice tidak ditemukan atau bukan milik Anda");
    }
    return this.paymentsService.createTransaction({ invoiceId, paymentMethod, paymentChannel });
  }

  // ─── Pembayaran via MAGIC LINK (tanpa login), diverifikasi lewat payToken ──

  private async findByToken(token: string): Promise<Invoice> {
    if (!token) throw new ForbiddenException("Tautan pembayaran tidak valid");
    const invoice = await this.invoiceRepo.findOne({
      where: { payToken: token },
      relations: ["subscription", "subscription.customer", "subscription.package", "items", "payments"],
    });
    if (!invoice) throw new ForbiddenException("Tautan pembayaran tidak valid atau kedaluwarsa");
    return invoice;
  }

  /** Detail invoice untuk halaman bayar publik (hanya info yang perlu). */
  async getInvoiceByToken(token: string) {
    const invoice = await this.findByToken(token);
    const mapped = this.mapInvoice(invoice);
    return {
      ...mapped,
      customerName: invoice.subscription?.customer?.name,
      packageName: (invoice.subscription as any)?.package?.name,
    };
  }

  async payByToken(token: string, paymentMethod: "va" | "qris" | "ewallet", paymentChannel?: string) {
    const invoice = await this.findByToken(token);
    if (invoice.status === "paid") {
      throw new ForbiddenException("Tagihan ini sudah lunas");
    }
    return this.paymentsService.createTransaction({ invoiceId: invoice.id, paymentMethod, paymentChannel });
  }

  async checkByToken(token: string) {
    const invoice = await this.findByToken(token);
    return this.paymentsService.checkPaymentStatus(invoice.id);
  }

  /**
   * CEK TAGIHAN publik: cari tagihan belum lunas berdasarkan nomor pelanggan
   * atau nomor HP. Mengembalikan info minimal + payToken untuk tiap tagihan,
   * sehingga pelanggan bisa langsung membayar tanpa login.
   *
   * Rate-limit diterapkan di controller. Hanya mengembalikan tagihan berstatus
   * unpaid/overdue (bukan data sensitif lain).
   */
  async lookupInvoices(query: string) {
    const q = (query || "").trim();
    if (!q) return { found: false, invoices: [] };

    // Bangun daftar kandidat nomor HP (normalisasi 08/62/+62) + kemungkinan nomor pelanggan
    const digits = q.replace(/[^0-9]/g, "");
    const phoneVariants = new Set<string>([q, digits]);
    if (digits.startsWith("0")) phoneVariants.add("62" + digits.slice(1));
    if (digits.startsWith("62")) phoneVariants.add("0" + digits.slice(2));

    const qb = this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .leftJoinAndSelect("subscription.package", "package")
      .where("invoice.status IN (:...statuses)", { statuses: ["unpaid", "overdue"] })
      .andWhere(
        "(UPPER(customer.customerNumber) = UPPER(:cnum) OR customer.phone IN (:...phones))",
        { cnum: q, phones: Array.from(phoneVariants) },
      )
      .orderBy("invoice.dueDate", "ASC");

    const invoices = await qb.getMany();
    if (invoices.length === 0) return { found: false, invoices: [] };

    // Pastikan setiap invoice punya payToken (buat on-demand jika kosong)
    const result: Array<{
      invoiceNumber: string;
      amount: number;
      dueDate: Date;
      status: string;
      period?: string;
      packageName?: string;
      payToken: string;
    }> = [];
    for (const inv of invoices) {
      let token: string = inv.payToken ?? "";
      if (!token) {
        token = require("crypto").randomBytes(24).toString("hex");
        await this.invoiceRepo.update(inv.id, { payToken: token });
      }
      result.push({
        invoiceNumber: inv.invoiceNumber,
        amount: Number(inv.totalAmount ?? inv.amount ?? 0),
        dueDate: inv.dueDate,
        status: inv.status,
        period: (inv as any).periodStart
          ? new Date((inv as any).periodStart).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
          : undefined,
        packageName: (inv.subscription as any)?.package?.name,
        payToken: token,
      });
    }

    return {
      found: true,
      customerName: invoices[0].subscription?.customer?.name,
      customerNumber: invoices[0].subscription?.customer?.customerNumber,
      invoices: result,
    };
  }
}
