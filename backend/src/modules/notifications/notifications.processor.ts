import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { NotificationsService } from "./notifications.service";
import { InvoicesService } from "../invoices/invoices.service";

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
    private readonly invoicesService: InvoicesService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { invoiceId, customerId } = job.data;
    const invoice = await this.invoicesService.findOne(invoiceId);
    const customer = invoice.subscription.customer;

    const context = {
      customerName: customer.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.totalAmount).toLocaleString("id-ID"),
      dueDate: new Date(invoice.dueDate).toLocaleDateString("id-ID"),
      paymentLink: `${process.env.PORTAL_BASE_URL ?? ""}/invoices/${invoice.id}`,
    };

    await this.notificationsService.sendAndLog({
      customerId: customerId ?? customer.id,
      invoiceId: invoice.id,
      phone: customer.phone,
      type: job.name as any,
      context,
    });

    this.logger.log(`Job ${job.name} untuk invoice ${invoice.invoiceNumber} selesai diproses`);
  }
}
