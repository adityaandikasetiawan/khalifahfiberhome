import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { Subscription } from "../subscriptions/entities/subscription.entity";

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private readonly itemRepo: Repository<InvoiceItem>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  private generateInvoiceNumber(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${y}${m}-${rand}`;
  }

  /** Token acak untuk magic-link pembayaran tanpa login. */
  private generatePayToken(): string {
    return crypto.randomBytes(24).toString("hex");
  }

  /**
   * Pastikan invoice punya payToken. Untuk invoice lama yang dibuat sebelum
   * fitur ini ada, token dibuat on-demand lalu disimpan.
   */
  async ensurePayToken(invoice: Invoice): Promise<string> {
    if (invoice.payToken) return invoice.payToken;
    const token = this.generatePayToken();
    await this.invoiceRepo.update(invoice.id, { payToken: token });
    invoice.payToken = token;
    return token;
  }

  /**
   * Membuat invoice manual (mis. biaya instalasi/tambahan di luar siklus bulanan).
   */
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const subscription = await this.subscriptionRepo.findOne({ where: { id: dto.subscriptionId } });
    if (!subscription) throw new NotFoundException("Subscription tidak ditemukan");
    if (!dto.items.length) throw new BadRequestException("Invoice harus memiliki minimal 1 item");

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 7);

    // Masa aktif invoice = 1 bulan penuh.
    // Jika pelanggan sudah punya masa aktif berjalan (invoice lunas terakhir),
    // periode baru menyambung dari situ; jika belum, mulai dari hari ini.
    const lastPaid = await this.invoiceRepo.findOne({
      where: { subscriptionId: subscription.id, status: "paid" as any },
      order: { periodEnd: "DESC" },
    });

    let periodStart: Date;
    if (lastPaid?.periodEnd && new Date(lastPaid.periodEnd) >= now) {
      periodStart = new Date(lastPaid.periodEnd);
      periodStart.setDate(periodStart.getDate() + 1);
    } else {
      periodStart = new Date(now);
    }
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);

    const items = dto.items.map((i) =>
      this.itemRepo.create({ ...i, subtotal: i.qty * i.unitPrice }),
    );
    const amount = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      payToken: this.generatePayToken(),
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
      amount,
      taxAmount: 0,
      totalAmount: amount,
      dueDate,
      status: "unpaid",
      items,
    });

    return this.invoiceRepo.save(invoice);
  }

  /**
   * Dipanggil oleh cron job harian (lihat invoice-generator.job.ts).
   * Membuat invoice bulanan otomatis untuk semua subscription yang billingDay-nya
   * jatuh pada tanggal hari ini.
   */
  async generateMonthlyInvoiceForSubscription(subscription: Subscription): Promise<Invoice> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 7); // jatuh tempo 7 hari

    // Guard anti duplikat: kalau invoice untuk subscription + periode ini sudah
    // ada (mis. cron jalan >1 instance, atau job ter-retry), kembalikan yang ada
    // daripada membuat invoice ganda (mencegah pelanggan tertagih dobel).
    const existing = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .where("invoice.subscriptionId = :sid", { sid: subscription.id })
      .andWhere("CAST(invoice.periodStart AS DATE) = :ps", {
        ps: periodStart.toISOString().split("T")[0],
      })
      .getOne();
    if (existing) {
      this.logger.warn(
        `Invoice periode ${periodStart.toISOString().split("T")[0]} untuk subscription ${subscription.id} sudah ada (${existing.invoiceNumber}), skip pembuatan ganda`,
      );
      return existing;
    }

    const item = this.itemRepo.create({
      description: `Langganan ${subscription.package.name} - ${periodStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      qty: 1,
      unitPrice: subscription.package.price,
      subtotal: subscription.package.price,
    });

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      payToken: this.generatePayToken(),
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
      amount: subscription.package.price,
      taxAmount: 0,
      totalAmount: subscription.package.price,
      dueDate,
      status: "unpaid",
      items: [item],
    });

    const saved = await this.invoiceRepo.save(invoice);
    this.logger.log(`Invoice ${saved.invoiceNumber} dibuat untuk subscription ${subscription.id}`);
    return saved;
  }

  /**
   * Hitung "masa aktif" subscription = periodEnd dari invoice LUNAS terakhir.
   * Kalau belum ada invoice lunas, kembalikan null (belum aktif berbayar).
   */
  async getActiveUntil(subscriptionId: string): Promise<Date | null> {
    const paid = await this.invoiceRepo.findOne({
      where: { subscriptionId, status: "paid" as any },
      order: { periodEnd: "DESC" },
    });
    return paid?.periodEnd ? new Date(paid.periodEnd) : null;
  }

  /**
   * Generate invoice perpanjangan untuk periode tertentu (1 bulan setelah
   * masa aktif berjalan). Dipakai oleh cron renewal H-3.
   * Idempotent: tidak akan membuat invoice ganda untuk periode yang sama.
   */
  async generateRenewalInvoice(subscription: Subscription, periodStart: Date, periodEnd: Date): Promise<Invoice | null> {
    // Cek apakah sudah ada invoice untuk periode ini (hindari dobel)
    const existing = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .where("invoice.subscriptionId = :sid", { sid: subscription.id })
      .andWhere("CAST(invoice.periodStart AS DATE) = :ps", { ps: periodStart.toISOString().split("T")[0] })
      .getOne();
    if (existing) return null;

    const now = new Date();
    // Jatuh tempo = hari terakhir masa aktif berjalan (sehari sebelum periode baru
    // mulai). Dengan begitu tenggang isolir (ISOLIR_GRACE_DAYS, default 2 hari)
    // dihitung dari saat masa aktif BERAKHIR, bukan dari tanggal invoice terbit.
    const dueDate = new Date(periodStart);
    dueDate.setDate(dueDate.getDate() - 1);

    const item = this.itemRepo.create({
      description: `Langganan ${subscription.package.name} - ${periodStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      qty: 1,
      unitPrice: subscription.package.price,
      subtotal: subscription.package.price,
    });

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      payToken: this.generatePayToken(),
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
      amount: subscription.package.price,
      taxAmount: 0,
      totalAmount: subscription.package.price,
      dueDate,
      status: "unpaid",
      items: [item],
    });
    const saved = await this.invoiceRepo.save(invoice);
    this.logger.log(`Invoice perpanjangan ${saved.invoiceNumber} dibuat untuk subscription ${subscription.id} (periode ${periodStart.toISOString().split("T")[0]} s/d ${periodEnd.toISOString().split("T")[0]}, jatuh tempo ${dueDate.toISOString().split("T")[0]})`);
    return saved;
  }

  findAll(params: { customerId?: string; status?: string }) {
    const qb = this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .leftJoinAndSelect("subscription.package", "package")
      .leftJoinAndSelect("invoice.items", "items")
      .orderBy("invoice.createdAt", "DESC");

    if (params.status) qb.andWhere("invoice.status = :status", { status: params.status });
    if (params.customerId) qb.andWhere("customer.id = :customerId", { customerId: params.customerId });

    return qb.getMany();
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ["subscription", "subscription.customer", "subscription.package", "items", "payments"],
    });
    if (!invoice) throw new NotFoundException("Invoice tidak ditemukan");
    return invoice;
  }

  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = "paid";
    invoice.paidAt = new Date();
    return this.invoiceRepo.save(invoice);
  }

  // Digunakan oleh isolir scheduler untuk mencari tagihan yang sudah lewat jatuh
  // tempo melewati grace period. Menyertakan status "unpaid" DAN "overdue" karena
  // cron markOverdueInvoices (jam 1 pagi) mengubah invoice lewat tempo menjadi
  // "overdue" sebelum scheduler isolir (jam 2 pagi) berjalan — kalau hanya cari
  // "unpaid", invoice yang sudah "overdue" tidak akan pernah terisolir.
  async findOverdue(graceDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - graceDays);

    return this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .where("invoice.status IN (:...statuses)", { statuses: ["unpaid", "overdue"] })
      .andWhere("invoice.dueDate <= :cutoff", { cutoff })
      .getMany();
  }

  // Menandai invoice unpaid yang lewat jatuh tempo sebagai overdue (dijalankan harian)
  async markOverdueInvoices() {
    const today = new Date();
    const result = await this.invoiceRepo
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: "overdue" })
      .where("status = :status", { status: "unpaid" })
      .andWhere("dueDate < :today", { today })
      .execute();
    return result.affected ?? 0;
  }

  // Ringkasan untuk dashboard/report
  async getSummary() {
    const [unpaidCount, overdueCount, paidThisMonth] = await Promise.all([
      this.invoiceRepo.count({ where: { status: "unpaid" } }),
      this.invoiceRepo.count({ where: { status: "overdue" } }),
      this.invoiceRepo
        .createQueryBuilder("invoice")
        .select("COALESCE(SUM(invoice.totalAmount), 0)", "total")
        .where("invoice.status = :status", { status: "paid" })
        .andWhere("EXTRACT(MONTH FROM invoice.paidAt) = EXTRACT(MONTH FROM CURRENT_DATE)")
        .andWhere("EXTRACT(YEAR FROM invoice.paidAt) = EXTRACT(YEAR FROM CURRENT_DATE)")
        .getRawOne(),
    ]);

    return {
      unpaidCount,
      overdueCount,
      revenueThisMonth: Number(paidThisMonth?.total ?? 0),
    };
  }
}
