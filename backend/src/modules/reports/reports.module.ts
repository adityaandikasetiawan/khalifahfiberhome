import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice } from "../invoices/entities/invoice.entity";
import { Customer } from "../customers/entities/customer.entity";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Customer])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
