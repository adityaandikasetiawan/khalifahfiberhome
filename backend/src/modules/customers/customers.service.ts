import { Injectable, NotFoundException, ConflictException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Repository, ILike } from "typeorm";
import { Customer } from "./entities/customer.entity";
import { Invoice } from "../invoices/entities/invoice.entity";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    // Auto-generate nomor pelanggan jika tidak diisi.
    let customerNumber = dto.customerNumber?.trim();
    if (!customerNumber) {
      customerNumber = await this.generateCustomerNumber();
    } else {
      const existing = await this.repo.findOne({ where: { customerNumber } });
      if (existing) throw new ConflictException("Nomor pelanggan sudah digunakan");
    }
    const customer = this.repo.create({ ...dto, customerNumber });
    return this.repo.save(customer);
  }

  /**
   * Generate nomor pelanggan berurutan dengan format KHA-XXX (3 digit, zero-pad).
   * Mengambil nomor terakhir lalu +1. Aman dari tabrakan lewat retry sederhana.
   */
  private async generateCustomerNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const last = await this.repo
        .createQueryBuilder("c")
        .where("c.customerNumber LIKE :prefix", { prefix: "KHA-%" })
        .orderBy("LENGTH(c.customerNumber)", "DESC")
        .addOrderBy("c.customerNumber", "DESC")
        .getOne();

      let nextSeq = 1;
      if (last?.customerNumber) {
        const numPart = parseInt(last.customerNumber.replace(/\D/g, ""), 10);
        if (!isNaN(numPart)) nextSeq = numPart + 1;
      }
      const candidate = `KHA-${String(nextSeq).padStart(3, "0")}`;
      const clash = await this.repo.findOne({ where: { customerNumber: candidate } });
      if (!clash) return candidate;
    }
    // Fallback anti-tabrakan: pakai timestamp
    return `KHA-${Date.now().toString().slice(-6)}`;
  }

  async findAll(search?: string, status?: string) {
    const where: any = {};
    if (search) where.name = ILike(`%${search}%`);
    if (status) where.status = status;
    return this.repo.find({ where, order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id }, relations: ["subscriptions"] });
    if (!customer) throw new NotFoundException("Pelanggan tidak ditemukan");
    return customer;
  }

  /**
   * Dipakai oleh portal-auth (login OTP WhatsApp) untuk mencari pelanggan
   * berdasarkan nomor telepon terdaftar.
   */
  async findByPhone(phone: string): Promise<Customer | null> {
    // Normalisasi: cocokkan nomor dalam format apapun (08xxx / 62xxx / +62xxx).
    // Kita generate beberapa varian dan cari yang cocok.
    const digits = phone.replace(/[^0-9]/g, "");
    let local = digits;
    let intl = digits;
    if (digits.startsWith("62")) {
      local = "0" + digits.slice(2);
      intl = digits;
    } else if (digits.startsWith("0")) {
      local = digits;
      intl = "62" + digits.slice(1);
    }
    const variants = Array.from(new Set([phone, digits, local, intl, "+" + intl]));
    for (const v of variants) {
      const found = await this.repo.findOne({ where: { phone: v } });
      if (found) return found;
    }
    return null;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    // Deteksi apakah email/telepon baru DIISI (sebelumnya kosong) atau berubah.
    const prevEmail = (customer.email ?? "").trim();
    const prevPhone = (customer.phone ?? "").trim();

    Object.assign(customer, dto);
    const saved = await this.repo.save(customer);

    const newEmail = (saved.email ?? "").trim();
    const newPhone = (saved.phone ?? "").trim();
    const contactBecameAvailable =
      (!!newEmail && newEmail !== prevEmail) || (!!newPhone && newPhone !== prevPhone);

    // Jika kontak baru diisi/berubah, kirimkan invoice yang BELUM lunas ke
    // pelanggan (via WA/email). Invoice lunas TIDAK dikirim ulang. Dedup guard
    // di NotificationsService mencegah pengiriman ganda channel yang sudah 'sent'.
    if (contactBecameAvailable) {
      await this.sendUnpaidInvoices(saved.id);
    }

    return saved;
  }

  /**
   * Kirim semua invoice belum lunas (unpaid/overdue) milik pelanggan ke
   * antrean notifikasi. Dipakai saat kontak pelanggan baru diisi.
   */
  private async sendUnpaidInvoices(customerId: string): Promise<void> {
    try {
      const invoices = await this.invoiceRepo
        .createQueryBuilder("invoice")
        .leftJoin("invoice.subscription", "subscription")
        .leftJoin("subscription.customer", "customer")
        .where("customer.id = :customerId", { customerId })
        .andWhere("invoice.status IN (:...statuses)", { statuses: ["unpaid", "overdue"] })
        .getMany();

      for (const inv of invoices) {
        await this.notificationsQueue.add("invoice_created", {
          invoiceId: inv.id,
          customerId,
        });
      }
      if (invoices.length > 0) {
        this.logger.log(`Kontak pelanggan ${customerId} diperbarui -> kirim ${invoices.length} invoice belum lunas`);
      }
    } catch (err) {
      this.logger.error(`Gagal kirim invoice belum lunas untuk ${customerId}`, err as Error);
      // tidak dilempar: update kontak tetap sukses
    }
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    customer.status = "terminated";
    await this.repo.save(customer);
  }
}
