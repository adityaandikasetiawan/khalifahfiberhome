import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { NotificationLog } from "./entities/notification-log.entity";
import { WaMessage } from "./entities/wa-message.entity";
import { Invoice } from "../invoices/entities/invoice.entity";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { Customer } from "../customers/entities/customer.entity";
import { Broadcast } from "../broadcast/entities/broadcast.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";
import { NotificationsService } from "./notifications.service";
import { WhatsAppService } from "./whatsapp.service";
import { WaChatService } from "./wa-chat.service";
import { EmailService } from "./email.service";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationSchedulerJob } from "./notification-scheduler.job";
import { WhatsAppController } from "./whatsapp.controller";
import { WaChatController } from "./wa-chat.controller";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog, WaMessage, Invoice, SiteSetting, Customer, Broadcast, Subscription]),
    // Retry: jika WA gateway sementara belum siap (mis. sedang initializing
    // setelah restart), job dicoba ulang beberapa kali dengan backoff. Kegagalan
    // permanen (nomor tak terdaftar) TIDAK di-retry (lihat sendWhatsApp).
    BullModule.registerQueue({
      name: "notifications",
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 30000 }, // 30s, 60s, 120s, 240s
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
    InvoicesModule,
  ],
  controllers: [WhatsAppController, WaChatController],
  providers: [NotificationsService, WhatsAppService, WaChatService, EmailService, NotificationsProcessor, NotificationSchedulerJob],
  exports: [NotificationsService, WhatsAppService, EmailService],
})
export class NotificationsModule {}
