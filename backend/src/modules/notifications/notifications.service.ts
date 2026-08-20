import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationLog, NotificationType } from "./entities/notification-log.entity";
import { WhatsAppService } from "./whatsapp.service";

const MESSAGE_TEMPLATES: Record<NotificationType, (ctx: any) => string> = {
  invoice_created: (ctx) =>
    `Halo ${ctx.customerName}, tagihan ${ctx.invoiceNumber} sebesar Rp${ctx.amount} telah terbit. Jatuh tempo: ${ctx.dueDate}. Bayar melalui: ${ctx.paymentLink}`,
  reminder_h3: (ctx) =>
    `Pengingat: tagihan ${ctx.invoiceNumber} sebesar Rp${ctx.amount} akan jatuh tempo dalam 3 hari (${ctx.dueDate}).`,
  reminder_h1: (ctx) =>
    `Pengingat: tagihan ${ctx.invoiceNumber} sebesar Rp${ctx.amount} jatuh tempo besok (${ctx.dueDate}).`,
  overdue: (ctx) =>
    `Tagihan ${ctx.invoiceNumber} sebesar Rp${ctx.amount} telah melewati jatuh tempo. Mohon segera lakukan pembayaran untuk menghindari pemutusan layanan.`,
  isolir: (ctx) =>
    `Mohon maaf, layanan internet Anda telah dinonaktifkan sementara karena tunggakan tagihan ${ctx.invoiceNumber}. Layanan akan aktif kembali setelah pembayaran diterima.`,
  payment_success: (ctx) =>
    `Pembayaran untuk tagihan ${ctx.invoiceNumber} sebesar Rp${ctx.amount} telah kami terima. Terima kasih!`,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog) private readonly repo: Repository<NotificationLog>,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  async sendAndLog(params: {
    customerId: string;
    invoiceId?: string;
    phone: string;
    type: NotificationType;
    context: Record<string, any>;
  }) {
    const message = MESSAGE_TEMPLATES[params.type](params.context);
    try {
      await this.whatsAppService.sendMessage(params.phone, message);
      await this.repo.save(
        this.repo.create({
          customerId: params.customerId,
          invoiceId: params.invoiceId,
          channel: "whatsapp",
          type: params.type,
          status: "sent",
        }),
      );
    } catch (err) {
      this.logger.error(`Gagal kirim notifikasi ${params.type} ke ${params.phone}`, err as Error);
      await this.repo.save(
        this.repo.create({
          customerId: params.customerId,
          invoiceId: params.invoiceId,
          channel: "whatsapp",
          type: params.type,
          status: "failed",
          errorMessage: (err as Error).message,
        }),
      );
    }
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { sentAt: "DESC" } });
  }
}
