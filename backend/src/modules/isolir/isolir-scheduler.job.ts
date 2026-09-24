import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { InvoicesService } from "../invoices/invoices.service";

/**
 * Cron job harian: cek invoice yang sudah overdue melewati grace period
 * (default 3 hari, lihat env ISOLIR_GRACE_DAYS) dan ISOLIR OTOMATIS pelanggan
 * yang menunggak — langsung disable PPPoE di router tanpa menunggu teknisi.
 *
 * Setiap invoice overdue di-enqueue sebagai job "suspend" ke queue "isolir"
 * (dengan retry BullMQ). Processor (IsolirProcessor) akan men-disable PPPoE,
 * mengubah status subscription menjadi suspended, dan mengirim notifikasi.
 */
@Injectable()
export class IsolirSchedulerJob {
  private readonly logger = new Logger(IsolirSchedulerJob.name);

  constructor(
    private readonly invoicesService: InvoicesService,
    @InjectQueue("isolir") private readonly isolirQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleIsolirCheck() {
    const graceDays = parseInt(process.env.ISOLIR_GRACE_DAYS ?? "3", 10);
    const overdueInvoices = await this.invoicesService.findOverdue(graceDays);

    this.logger.log(`${overdueInvoices.length} invoice overdue melewati grace period ${graceDays} hari`);

    for (const invoice of overdueInvoices) {
      // Enqueue isolir otomatis (retry ditangani BullMQ). jobId dedup per
      // subscription agar tidak menumpuk job ganda dalam satu hari.
      await this.isolirQueue.add(
        "suspend",
        {
          subscriptionId: invoice.subscriptionId,
          invoiceId: invoice.id,
          reason: `Invoice ${invoice.invoiceNumber} belum dibayar setelah ${graceDays} hari jatuh tempo`,
        },
        {
          jobId: `suspend:${invoice.subscriptionId}`,
          attempts: 5,
          backoff: { type: "exponential", delay: 30000 },
        },
      );
    }
  }
}
