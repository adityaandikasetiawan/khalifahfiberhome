import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice } from "../invoices/entities/invoice.entity";

/**
 * Cron job harian untuk mengirim reminder H-3 dan H-1 sebelum jatuh tempo.
 * Hari reminder dikonfigurasi via env INVOICE_REMINDER_DAYS_BEFORE (default: 3,1).
 */
@Injectable()
export class NotificationSchedulerJob {
  private readonly logger = new Logger(NotificationSchedulerJob.name);

  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleReminders() {
    const daysConfig = (process.env.INVOICE_REMINDER_DAYS_BEFORE ?? "3,1").split(",").map(Number);

    for (const daysBefore of daysConfig) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const dateStr = targetDate.toISOString().split("T")[0];

      const invoices = await this.invoiceRepo
        .createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.subscription", "subscription")
        .leftJoinAndSelect("subscription.customer", "customer")
        .where("invoice.status = :status", { status: "unpaid" })
        .andWhere("CAST(invoice.dueDate AS DATE) = :dateStr", { dateStr })
        .getMany();

      const jobName = daysBefore === 3 ? "reminder_h3" : daysBefore === 1 ? "reminder_h1" : `reminder_h${daysBefore}`;

      for (const invoice of invoices) {
        await this.notificationsQueue.add(jobName, {
          invoiceId: invoice.id,
          customerId: invoice.subscription.customer.id,
        });
      }

      this.logger.log(`${invoices.length} reminder (H-${daysBefore}) dimasukkan ke antrian`);
    }
  }
}
