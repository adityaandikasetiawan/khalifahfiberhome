import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
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
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
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
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: dto.subscriptionId },
      relations: ["customer"],
    });
    if (!subscription) throw new NotFoundException("Subscription tidak ditemukan");
    if (!dto.items.length) throw new BadRequestException("Invoice harus memiliki minimal 1 item");

    const now = new Date();

    // Masa aktif invoice = 1 bulan kalender (konsisten dgn model "tgl bayar + 1
    // bulan"). Prioritas periodStart:
    //  1) invoiceDate dari admin (bila dikirim) -> admin menentukan tgl invoice
    //  2) menyambung masa aktif berjalan (invoice lunas terakhir)
    //  3) mulai hari ini
    const lastPaid = await this.invoiceRepo.findOne({
      where: { subscriptionId: subscription.id, status: "paid" as any },
      order: { periodEnd: "DESC" },
    });

    let periodStart: Date;
    if (dto.invoiceDate) {
      periodStart = new Date(dto.invoiceDate);
    } else if (lastPaid?.periodEnd && new Date(lastPaid.periodEnd) >= now) {
      periodStart = new Date(lastPaid.periodEnd);
      periodStart.setDate(periodStart.getDate() + 1);
    } else {
      periodStart = new Date(now);
    }
    const periodEnd = this.addOneCalendarMonth(periodStart);
    // Jatuh tempo = akhir masa aktif (konsisten dgn kebijakan baru), BUKAN
    // terbit + 7 hari. Pelanggan membayar untuk periode berjalan sampai tanggal ini.
    const dueDate = new Date(periodEnd);

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

    const saved = await this.invoiceRepo.save(invoice);

    // Kirim notifikasi "tagihan baru" ke pelanggan (WA + email), sama seperti
    // invoice yang dibuat otomatis oleh cron bulanan. Dibungkus try/catch agar
    // kegagalan enqueue tidak membatalkan pembuatan invoice.
    // Jika admin menjadwalkan sendDate di masa depan, tunda pengiriman WA
    // (BullMQ delay). Kosong / sudah lewat -> kirim sekarang.
    let delayMs = 0;
    if (dto.sendDate) {
      const sendAt = new Date(dto.sendDate);
      const diff = sendAt.getTime() - Date.now();
      if (diff > 0) delayMs = diff;
    }
    try {
      await this.notificationsQueue.add(
        "invoice_created",
        { customerId: subscription.customer?.id, invoiceId: saved.id },
        { attempts: 5, backoff: { type: "exponential", delay: 30000 }, delay: delayMs },
      );
      if (delayMs > 0) {
        this.logger.log(
          `Notifikasi invoice ${saved.invoiceNumber} dijadwalkan kirim ${new Date(dto.sendDate!).toISOString().split("T")[0]} (delay ${Math.round(delayMs / 3600000)} jam)`,
        );
      }
    } catch (err) {
      this.logger.error(`Gagal enqueue notifikasi invoice ${saved.invoiceNumber}: ${(err as Error).message}`);
    }

    return saved;
  }

  /**
   * Dipanggil oleh cron job harian (lihat invoice-generator.job.ts).
   * Membuat invoice bulanan otomatis untuk semua subscription yang billingDay-nya
   * jatuh pada tanggal hari ini.
   */
  /**
   * Susun item invoice + total dengan memperhitungkan diskon bulanan per
   * subscription (mis. subsidi/donasi). Mengembalikan baris langganan + baris
   * potongan (nilai negatif) bila ada diskon. Total tidak pernah < 0.
   */
  private buildItemsWithDiscount(subscription: Subscription, periodStart: Date) {
    const price = Number(subscription.package.price);
    const discount = Number((subscription as any).discount ?? 0);
    const total = Math.max(0, price - discount);
    const label = periodStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    const items = [
      this.itemRepo.create({
        description: `Langganan ${subscription.package.name} - ${label}`,
        qty: 1,
        unitPrice: price,
        subtotal: price,
      }),
    ];
    if (discount > 0) {
      items.push(
        this.itemRepo.create({
          description: "Potongan/subsidi",
          qty: 1,
          unitPrice: -discount,
          subtotal: -discount,
        }),
      );
    }
    return { items, total };
  }

  async generateMonthlyInvoiceForSubscription(subscription: Subscription): Promise<Invoice> {
    const now = new Date();
    // Model billing baru: masa aktif = hari ini s/d hari ini + 1 bulan kalender
    // (BUKAN periode kalender 01-akhir bulan). Masa aktif final tetap dihitung
    // ulang saat dibayar (markAsPaid = paidAt + 1 bulan).
    const periodStart = new Date(now);
    const periodEnd = this.addOneCalendarMonth(periodStart);
    // Jatuh tempo = akhir masa aktif (periodEnd), BUKAN terbit + 7 hari.
    const dueDate = new Date(periodEnd);

    // Guard anti duplikat: kalau subscription sudah punya invoice yang belum
    // lunas / masih berjalan, jangan buat lagi (mencegah dobel saat cron
    // ter-retry atau jalan >1 instance).
    const existing = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .where("invoice.subscriptionId = :sid", { sid: subscription.id })
      .andWhere("invoice.status IN (:...st)", { st: ["unpaid", "overdue"] })
      .getOne();
    if (existing) {
      this.logger.warn(
        `Subscription ${subscription.id} sudah punya invoice belum lunas (${existing.invoiceNumber}), skip pembuatan ganda`,
      );
      return existing;
    }

    const { items, total } = this.buildItemsWithDiscount(subscription, periodStart);

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      payToken: this.generatePayToken(),
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
      amount: total,
      taxAmount: 0,
      totalAmount: total,
      dueDate,
      status: "unpaid",
      items,
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

  /** True jika subscription sudah pernah punya invoice (apa pun statusnya). */
  async hasAnyInvoice(subscriptionId: string): Promise<boolean> {
    const n = await this.invoiceRepo.count({ where: { subscriptionId } });
    return n > 0;
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

    const { items, total } = this.buildItemsWithDiscount(subscription, periodStart);

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      payToken: this.generatePayToken(),
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
      amount: total,
      taxAmount: 0,
      totalAmount: total,
      dueDate,
      status: "unpaid",
      items,
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

  /**
   * Tambah 1 BULAN KALENDER dari sebuah tanggal, aman terhadap overflow akhir
   * bulan: 31 Jan + 1 bln -> 28/29 Feb (clamp ke hari terakhir bulan target),
   * 30 Jan + 1 bln -> 28/29 Feb. Timezone mengikuti server (TZ=Asia/Jakarta).
   */
  private addOneCalendarMonth(from: Date): Date {
    const d = new Date(from);
    const day = d.getDate();
    const t = new Date(d);
    t.setMonth(t.getMonth() + 1);
    // Jika hari meluber ke bulan berikutnya (mis. 31 Jan -> 3 Mar), mundur ke
    // hari terakhir bulan target.
    if (t.getDate() !== day) {
      t.setDate(0);
    }
    return t;
  }

  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    const paidAt = new Date();
    invoice.status = "paid";
    invoice.paidAt = paidAt;
    // Masa aktif dihitung ULANG saat invoice DIBAYAR:
    // periodStart = tanggal bayar, periodEnd = tanggal bayar + 1 bulan kalender.
    // Ini menggantikan periode "perkiraan" yang diisi saat invoice terbit.
    invoice.periodStart = paidAt;
    invoice.periodEnd = this.addOneCalendarMonth(paidAt);
    // Jatuh tempo = akhir masa aktif (periodEnd). Harus ikut digeser saat
    // pembayaran agar tagihan berikutnya / isolir dihitung dari akhir masa
    // aktif yang baru, bukan dari periode kalender lama.
    invoice.dueDate = invoice.periodEnd;
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

    return (
      this.invoiceRepo
        .createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.subscription", "subscription")
        .where("invoice.status IN (:...statuses)", { statuses: ["unpaid", "overdue"] })
        .andWhere("invoice.dueDate <= :cutoff", { cutoff })
        // JANGAN isolir pelanggan yang MASIH punya masa aktif berjalan: yaitu
        // ada invoice LUNAS lain dengan periodEnd >= hari ini. Mencegah pelanggan
        // yang sudah bayar periode berjalan ikut terisolir hanya karena ada
        // invoice unpaid lain (mis. renewal terbit lebih awal / invoice dobel).
        // Pelanggan baru diisolir bila benar-benar sudah lewat masa aktif.
        .andWhere(
          `NOT EXISTS (
            SELECT 1 FROM invoices paid
            WHERE paid.subscription_id = invoice.subscription_id
              AND paid.status = 'paid'
              AND paid."periodEnd" >= CURRENT_DATE
          )`,
        )
        .getMany()
    );
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
