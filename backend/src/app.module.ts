import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';

import { typeOrmConfig } from './config/database.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PackagesModule } from './modules/packages/packages.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IsolirModule } from './modules/isolir/isolir.module';
import { MikrotikModule } from './modules/mikrotik/mikrotik.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PortalAuthModule } from './modules/portal-auth/portal-auth.module';
import { PortalModule } from './modules/portal/portal.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { OdpModule } from './modules/odp/odp.module';
import { BroadcastModule } from './modules/broadcast/broadcast.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: parseInt(config.get('REDIS_PORT', '6379'), 10),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            // Default: 60 request/menit per IP. Endpoint sensitif (login, webhook)
            // punya limit lebih ketat lewat @Throttle() di controller masing-masing.
            ttl: 60000,
            limit: 60,
          },
        ],
        // Redis-backed -- limit tetap konsisten walau server di-restart atau
        // di-scale ke banyak instance (beda dari storage in-memory default
        // yang reset tiap restart dan tidak sinkron antar instance).
        storage: new ThrottlerStorageRedisService({
          host: config.get('REDIS_HOST', 'localhost'),
          port: parseInt(config.get('REDIS_PORT', '6379'), 10),
        } as any),
      }),
    }),

    AuthModule,
    UsersModule,
    CustomersModule,
    PackagesModule,
    SubscriptionsModule,
    InvoicesModule,
    PaymentsModule,
    NotificationsModule,
    IsolirModule,
    MikrotikModule,
    ReportsModule,
    PortalAuthModule,
    PortalModule,
    TicketsModule,
    OdpModule,
    BroadcastModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
