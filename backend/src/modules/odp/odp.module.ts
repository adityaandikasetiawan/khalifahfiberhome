import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Odp } from "./entities/odp.entity";
import { OdpService } from "./odp.service";
import { OdpController } from "./odp.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Odp])],
  providers: [OdpService],
  controllers: [OdpController],
  exports: [OdpService],
})
export class OdpModule {}
