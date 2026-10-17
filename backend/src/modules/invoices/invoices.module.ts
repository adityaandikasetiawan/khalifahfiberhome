import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { InvoiceGeneratorJob } from "./invoice-generator.job";
import { InvoicePdfService } from "./invoice-pdf.service";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { SiteSettingsModule } from "../site-settings/site-settings.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem, Subscription]),
    BullModule.registerQueue({ name: "notifications" }),
    SubscriptionsModule,
    SiteSettingsModule,
  ],
  providers: [InvoicesService, InvoiceGeneratorJob, InvoicePdfService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
