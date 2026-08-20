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

    for (const subscription of dueSubscriptions) {
      try {
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
}
