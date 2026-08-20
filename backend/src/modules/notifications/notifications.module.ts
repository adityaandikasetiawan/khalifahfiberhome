import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { NotificationLog } from "./entities/notification-log.entity";
import { Invoice } from "../invoices/entities/invoice.entity";
import { NotificationsService } from "./notifications.service";
import { WhatsAppService } from "./whatsapp.service";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationSchedulerJob } from "./notification-scheduler.job";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog, Invoice]),
    BullModule.registerQueue({ name: "notifications" }),
    InvoicesModule,
  ],
  providers: [NotificationsService, WhatsAppService, NotificationsProcessor, NotificationSchedulerJob],
  exports: [NotificationsService, WhatsAppService],
})
export class NotificationsModule {}
