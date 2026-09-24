import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Customer } from "../customers/entities/customer.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";
import { Package } from "../packages/entities/package.entity";
import { Invoice } from "../invoices/entities/invoice.entity";
import { InvoiceItem } from "../invoices/entities/invoice-item.entity";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { RegistrationService } from "./registration.service";
import { RegistrationController } from "./registration.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { MikrotikModule } from "../mikrotik/mikrotik.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Subscription, Package, Invoice, InvoiceItem, SiteSetting]),
    NotificationsModule, // untuk EmailService (Brevo)
    MikrotikModule, // untuk membuat & enable PPPoE saat approval teknisi
  ],
  providers: [RegistrationService],
  controllers: [RegistrationController],
})
export class RegistrationModule {}
