import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { SuspensionLog } from "./entities/suspension-log.entity";
import { NetworkTask } from "./entities/network-task.entity";
import { IsolirService } from "./isolir.service";
import { IsolirController } from "./isolir.controller";
import { IsolirSchedulerJob } from "./isolir-scheduler.job";
import { IsolirProcessor } from "./isolir.processor";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { InvoicesModule } from "../invoices/invoices.module";
import { UsersModule } from "../users/users.module";
import { MikrotikModule } from "../mikrotik/mikrotik.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SuspensionLog, NetworkTask]),
    BullModule.registerQueue({ name: "notifications" }, { name: "isolir" }),
    SubscriptionsModule,
    InvoicesModule,
    UsersModule,
    MikrotikModule,
  ],
  providers: [IsolirService, IsolirSchedulerJob, IsolirProcessor],
  controllers: [IsolirController],
  exports: [IsolirService],
})
export class IsolirModule {}
