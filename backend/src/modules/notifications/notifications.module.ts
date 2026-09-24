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
    BullModule.registerQueue({ name: "notifications" }),
    InvoicesModule,
  ],
  controllers: [WhatsAppController],
  providers: [NotificationsService, WhatsAppService, EmailService, NotificationsProcessor, NotificationSchedulerJob],
  exports: [NotificationsService, WhatsAppService, EmailService],
})
export class NotificationsModule {}
