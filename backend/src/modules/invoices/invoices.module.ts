import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { InvoiceGeneratorJob } from "./invoice-generator.job";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem, Subscription]),
    BullModule.registerQueue({ name: "notifications" }),
    SubscriptionsModule,
  ],
  providers: [InvoicesService, InvoiceGeneratorJob],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
