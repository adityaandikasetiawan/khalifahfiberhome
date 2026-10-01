import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "bullmq";
import * as crypto from "crypto";
import { NotificationsService } from "./notifications.service";
import { WhatsAppService } from "./whatsapp.service";
import { InvoicesService } from "../invoices/invoices.service";
import { Customer } from "../customers/entities/customer.entity";
import { Broadcast } from "../broadcast/entities/broadcast.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";

/**
 * Worker BullMQ untuk queue "notifications". Memproses job yang di-push oleh
 * invoice generator, payment webhook, dan notification scheduler, sehingga
 * pengiriman WhatsApp tidak memblokir request API.
 */
@Processor("notifications")
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly whatsAppService: WhatsAppService,
    private readonly invoicesService: InvoicesService,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Broadcast) private readonly broadcastRepo: Repository<Broadcast>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
  ) {
    super();
  }

  /**
   * Proses broadcast: ambil pelanggan sesuai target, kirim WA (teks + gambar
   * opsional), hitung sukses/gagal, dan update status broadcast ke "sent".
   */
  private async processBroadcast(data: {
    broadcastId: string;
    title: string;
    message: string;
    imageUrl?: string;
    targetType?: string;
    targetRouterId?: string;
  }): Promise<void> {
    const text = data.title ? `*${data.title}*\n\n${data.message}` : data.message;

    // Ambil penerima: pelanggan aktif yg punya nomor HP. Filter per router bila dipilih.
    const qb = this.subscriptionRepo
      .createQueryBuilder("s")
      .leftJoinAndSelect("s.customer", "c")
      .where("s.status = :st", { st: "active" })
      .andWhere("c.status = :cst", { cst: "active" })
      .andWhere("c.phone IS NOT NULL AND c.phone <> ''");
    if (data.targetType === "router" && data.targetRouterId) {
      qb.andWhere("s.routerId = :rid", { rid: data.targetRouterId });
    }
    const subs = await qb.getMany();

    // Dedup nomor (satu pelanggan bisa >1 subscription)
    const phones = Array.from(
      new Set(subs.map((s) => s.customer?.phone).filter((p): p is string => !!p)),
    );

    let sent = 0;
    let failed = 0;
    for (const phone of phones) {
      try {
        await this.whatsAppService.sendMessage(phone, text, data.imageUrl || undefined);
        sent++;
      } catch (err) {
        failed++;
        this.logger.error(`Broadcast gagal ke ${phone}: ${(err as Error).message}`);
      }
    }

    await this.broadcastRepo.update(data.broadcastId, {
      status: "sent",
      sentCount: sent,
      failedCount: failed,
    });
    this.logger.log(`Broadcast ${data.broadcastId} selesai: ${sent} terkirim, ${failed} gagal (dari ${phones.length} nomor)`);
  }

  /**
   * Untuk pelanggan LAMA yang belum punya password portal: siapkan info
   * "atur password" (username + tautan bertoken) agar bisa disisipkan di
   * invoice. Setelah password diset (passwordSetAt terisi), info ini tidak
   * lagi muncul. Mengembalikan undefined jika pelanggan sudah punya password.
   */
  private async buildResetPasswordInfo(customerId: string): Promise<
    { username: string; url: string } | undefined
  > {
    const c = await this.customerRepo
      .createQueryBuilder("c")
      .addSelect("c.password")
      .where("c.id = :id", { id: customerId })
      .getOne();
    if (!c || c.password) return undefined; // sudah punya password -> tidak perlu

    // Buat token reset (1 hari) supaya pelanggan bisa langsung atur password.
    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.customerRepo
      .createQueryBuilder()
      .update(Customer)
      .set({ passwordResetToken: token, passwordResetExpires: expires })
      .where("id = :id", { id: customerId })
      .execute();

    const base = process.env.PORTAL_BASE_URL ?? "";
    return { username: c.customerNumber, url: `${base}/atur-password?token=${token}` };
  }

  async process(job: Job): Promise<void> {
    // Job khusus: alert WA ke admin tiap ada pembayaran pelanggan masuk.
    if (job.name === "admin_payment_alert") {
      await this.notificationsService.sendAdminPaymentAlert(job.data);
      return;
    }

    // Job khusus: broadcast (teks + gambar opsional) ke pelanggan.
    if (job.name === "broadcast") {
      await this.processBroadcast(job.data);
      return;
    }

    const { invoiceId, customerId } = job.data;
    const invoice = await this.invoicesService.findOne(invoiceId);
    const customer = invoice.subscription.customer;

    const resetPassword = await this.buildResetPasswordInfo(customer.id);

    // Magic-link pembayaran tanpa login: pastikan invoice punya payToken lalu
    // arahkan tombol "Bayar" langsung ke halaman bayar publik.
    const payToken = await this.invoicesService.ensurePayToken(invoice);
    const base = process.env.PORTAL_BASE_URL ?? "";

    const periodStart = (invoice as any).periodStart;
    const context = {
      customerName: customer.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.totalAmount).toLocaleString("id-ID"),
      dueDate: new Date(invoice.dueDate).toLocaleDateString("id-ID"),
      period: periodStart
        ? new Date(periodStart).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
        : undefined,
      paymentLink: `${base}/bayar?token=${payToken}`,
      resetPassword, // undefined jika pelanggan sudah punya password
    };

    await this.notificationsService.sendAndLog({
      customerId: customerId ?? customer.id,
      invoiceId: invoice.id,
      phone: customer.phone,
      email: customer.email,
      type: job.name as any,
      context,
    });

    this.logger.log(`Job ${job.name} untuk invoice ${invoice.invoiceNumber} selesai diproses`);
  }
}
