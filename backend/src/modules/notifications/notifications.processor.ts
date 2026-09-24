import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "bullmq";
import * as crypto from "crypto";
import { NotificationsService } from "./notifications.service";
import { InvoicesService } from "../invoices/invoices.service";
import { Customer } from "../customers/entities/customer.entity";

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
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {
    super();
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
