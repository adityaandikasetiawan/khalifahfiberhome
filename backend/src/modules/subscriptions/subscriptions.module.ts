import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Subscription } from "./entities/subscription.entity";
import { Package } from "../packages/entities/package.entity";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { MikrotikModule } from "../mikrotik/mikrotik.module";

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Package]), MikrotikModule],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
