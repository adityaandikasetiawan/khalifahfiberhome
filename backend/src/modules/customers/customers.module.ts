import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Customer } from "./entities/customer.entity";
import { Invoice } from "../invoices/entities/invoice.entity";
import { CustomersService } from "./customers.service";
import { CustomersController } from "./customers.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Invoice]),
    BullModule.registerQueue({ name: "notifications" }),
  ],
  providers: [CustomersService],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
