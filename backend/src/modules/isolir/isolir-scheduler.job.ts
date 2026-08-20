import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { InvoicesService } from "../invoices/invoices.service";
import { IsolirService } from "./isolir.service";

/**
 * Cron job harian: cek invoice yang sudah overdue melewati grace period
 * (default 3 hari, lihat env ISOLIR_GRACE_DAYS) dan buat tugas isolir
 * untuk teknisi, plus notifikasi ke pelanggan.
 */
@Injectable()
export class IsolirSchedulerJob {
  private readonly logger = new Logger(IsolirSchedulerJob.name);

  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly isolirService: IsolirService,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleIsolirCheck() {
    const graceDays = parseInt(process.env.ISOLIR_GRACE_DAYS ?? "3", 10);
    const overdueInvoices = await this.invoicesService.findOverdue(graceDays);

    this.logger.log(`${overdueInvoices.length} invoice overdue melewati grace period ${graceDays} hari`);

    for (const invoice of overdueInvoices) {
      await this.isolirService.createSuspendTask(
        invoice.subscriptionId,
        invoice.id,
        `Invoice ${invoice.invoiceNumber} belum dibayar setelah ${graceDays} hari jatuh tempo`,
      );
      await this.notificationsQueue.add("isolir", {
        invoiceId: invoice.id,
        customerId: invoice.subscription?.customerId,
      });
    }
  }
}
