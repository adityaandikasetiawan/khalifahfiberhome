import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice } from "../invoices/entities/invoice.entity";
import { PortalService } from "./portal.service";
import { PortalController } from "./portal.controller";
import { PublicPayController } from "./public-pay.controller";
import { CustomersModule } from "../customers/customers.module";
import { PortalAuthModule } from "../portal-auth/portal-auth.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), CustomersModule, PortalAuthModule, PaymentsModule],
  providers: [PortalService],
  controllers: [PortalController, PublicPayController],
})
export class PortalModule {}
