import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { InvoicesService } from "./invoices.service";

/**
 * Cron job harian: generate invoice untuk semua subscription aktif
 * yang billingDay-nya jatuh pada tanggal hari ini, lalu men-trigger
 * notifikasi via queue.
 *
 * PENTING: pada deployment multi-instance (PM2 cluster), job ini hanya boleh
 * dijalankan pada SATU worker khusus untuk menghindari invoice double-generate.
 * Gunakan proses worker terpisah dari proses API (lihat docker-compose.yml).
 */
@Injectable()
export class InvoiceGeneratorJob {
  private readonly logger = new Logger(InvoiceGeneratorJob.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoicesService: InvoicesService,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyInvoiceGeneration() {
    const today = new Date().getDate();
    this.logger.log(`Menjalankan invoice generator untuk billingDay=${today}`);

    const dueSubscriptions = await this.subscriptionsService.findActiveDueToday(today);
    this.logger.log(`Ditemukan ${dueSubscriptions.length} subscription jatuh tempo hari ini`);

    const now = new Date();
    for (const subscription of dueSubscriptions) {
      try {
        // Guard: jangan tagih sebelum masa aktif dimulai (startDate).
        // Dipakai a.l. untuk menunda penagihan pelanggan migrasi ke bulan berikutnya.
        if (subscription.startDate && new Date(subscription.startDate) > now) {
          this.logger.log(
            `Lewati subscription ${subscription.id}: startDate ${new Date(subscription.startDate).toISOString().split("T")[0]} belum tiba`,
          );
          continue;
        }
        const invoice = await this.invoicesService.generateMonthlyInvoiceForSubscription(subscription);
        await this.notificationsQueue.add("invoice_created", {
          customerId: subscription.customer.id,
          invoiceId: invoice.id,
        });
      } catch (err) {
        this.logger.error(`Gagal generate invoice untuk subscription ${subscription.id}`, err as Error);
      }
    }
  }

  // Menandai invoice yang lewat jatuh tempo sebagai "overdue", dijalankan tiap dini hari
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleMarkOverdue() {
    const affected = await this.invoicesService.markOverdueInvoices();
    this.logger.log(`${affected} invoice ditandai sebagai overdue`);
  }

  /**
   * Cron RENEWAL: 3 hari sebelum masa aktif langganan berakhir, generate
   * invoice perpanjangan untuk periode 1 bulan berikutnya lalu kirim ke
   * pelanggan. "Masa aktif" = periodEnd dari invoice LUNAS terakhir.
   *
   * Hari H-x dikonfigurasi via env INVOICE_RENEWAL_DAYS_BEFORE (default 3).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleRenewalGeneration() {
    const daysBefore = parseInt(process.env.INVOICE_RENEWAL_DAYS_BEFORE ?? "3", 10);
    const subs = await this.subscriptionsService.findAllActive();
    this.logger.log(`Renewal check untuk ${subs.length} subscription aktif (H-${daysBefore})`);

    for (const sub of subs) {
      try {
        const activeUntil = await this.invoicesService.getActiveUntil(sub.id);
        if (!activeUntil) continue; // belum pernah bayar, invoice awal ditangani manual/proses lain

        // Cek apakah hari ini = H-x sebelum masa aktif berakhir
        const trigger = new Date(activeUntil);
        trigger.setDate(trigger.getDate() - daysBefore);
        const today = new Date();
        const sameDay =
          trigger.getFullYear() === today.getFullYear() &&
          trigger.getMonth() === today.getMonth() &&
          trigger.getDate() === today.getDate();
        if (!sameDay) continue;

        // Periode baru: mulai sehari setelah masa aktif berakhir, selama 1 bulan
        const periodStart = new Date(activeUntil);
        periodStart.setDate(periodStart.getDate() + 1);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);

        const invoice = await this.invoicesService.generateRenewalInvoice(sub, periodStart, periodEnd);
        if (invoice) {
          await this.notificationsQueue.add("invoice_created", {
            customerId: sub.customer.id,
            invoiceId: invoice.id,
          });
          this.logger.log(`Invoice perpanjangan dikirim untuk subscription ${sub.id}`);
        }
      } catch (err) {
        this.logger.error(`Gagal proses renewal subscription ${sub.id}`, err as Error);
      }
    }
  }
}
