import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Broadcast } from "./entities/broadcast.entity";
import { BroadcastService } from "./broadcast.service";
import { BroadcastController } from "./broadcast.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Broadcast]),
    BullModule.registerQueue({ name: "notifications" }),
  ],
  providers: [BroadcastService],
  controllers: [BroadcastController],
  exports: [BroadcastService],
})
export class BroadcastModule {}
