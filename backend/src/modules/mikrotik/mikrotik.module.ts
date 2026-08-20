import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Router } from "./entities/router.entity";
import { MikrotikApiService } from "./mikrotik-api.service";
import { MikrotikService } from "./mikrotik.service";
import { MikrotikController } from "./mikrotik.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Router])],
  providers: [MikrotikApiService, MikrotikService],
  controllers: [MikrotikController],
  exports: [MikrotikService],
})
export class MikrotikModule {}
