import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSetting } from './entities/site-setting.entity';
import { SiteSettingsService } from './site-settings.service';
import { SiteSettingsController } from './site-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSetting])],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule implements OnModuleInit {
  constructor(private readonly service: SiteSettingsService) {}

  async onModuleInit() {
    await this.service.seed();
  }
}
