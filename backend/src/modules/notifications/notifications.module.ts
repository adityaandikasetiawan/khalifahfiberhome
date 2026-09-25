import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { NotificationLog } from "./entities/notification-log.entity";
import { Invoice } from "../invoices/entities/invoice.entity";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { Customer } from "../customers/entities/customer.entity";
import { NotificationsService } from "./notifications.service";
import { WhatsAppService } from "./whatsapp.service";
import { EmailService } from "./email.service";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationSchedulerJob } from "./notification-scheduler.job";
import { WhatsAppController } from "./whatsapp.controller";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog, Invoice, SiteSetting, Customer]),
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
  controllers: [WhatsAppController],
  providers: [NotificationsService, WhatsAppService, EmailService, NotificationsProcessor, NotificationSchedulerJob],
  exports: [NotificationsService, WhatsAppService, EmailService],
})
export class NotificationsModule {}
