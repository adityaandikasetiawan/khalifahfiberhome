import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalAuthService } from "./portal-auth.service";
import { PortalAuthController } from "./portal-auth.controller";
import { CustomerJwtStrategy } from "./strategies/customer-jwt.strategy";
import { Customer } from "../customers/entities/customer.entity";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { CustomersModule } from "../customers/customers.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, SiteSetting]),
    CustomersModule,
    NotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
        // signOptions default tidak dipakai di sini karena expiresIn portal
        // pelanggan (7 hari) di-set eksplisit per-token di PortalAuthService,
        // beda dari sesi admin (15 menit).
      }),
    }),
  ],
  providers: [PortalAuthService, CustomerJwtStrategy],
  controllers: [PortalAuthController],
  exports: [CustomerJwtStrategy],
})
export class PortalAuthModule {}
