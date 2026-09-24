import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Router } from "./entities/router.entity";
import { Customer } from "../customers/entities/customer.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";
import { Package } from "../packages/entities/package.entity";
import { MikrotikApiService } from "./mikrotik-api.service";
import { MikrotikService } from "./mikrotik.service";
import { MikrotikImportService } from "./mikrotik-import.service";
import { CredentialVaultService } from "./credential-vault.service";
import { MikrotikController } from "./mikrotik.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Router, Customer, Subscription, Package])],
  providers: [MikrotikApiService, MikrotikService, MikrotikImportService, CredentialVaultService],
  controllers: [MikrotikController],
  exports: [MikrotikService],
})
export class MikrotikModule {}
