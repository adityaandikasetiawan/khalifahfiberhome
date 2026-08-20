import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Payment } from "./entities/payment.entity";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PaymentWebhookController } from "./webhooks/payment-webhook.controller";
import { MidtransProvider } from "./gateways/midtrans.provider";
import { XenditProvider } from "./gateways/xendit.provider";
import { IpaymuProvider } from "./gateways/ipaymu.provider";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    BullModule.registerQueue({ name: "notifications" }, { name: "isolir" }),
    InvoicesModule,
  ],
  providers: [PaymentsService, MidtransProvider, XenditProvider, IpaymuProvider],
  controllers: [PaymentsController, PaymentWebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
