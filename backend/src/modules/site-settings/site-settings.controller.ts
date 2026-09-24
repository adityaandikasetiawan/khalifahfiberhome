import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all site settings (public)' })
  async getAll() {
    return { data: await this.service.getAll() };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a specific site setting (public)' })
  async getByKey(@Param('key') key: string) {
    return { data: await this.service.getByKey(key) };
  }

  @Put(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a site setting (admin only)' })
  async update(@Param('key') key: string, @Body() dto: UpdateSiteSettingDto) {
    const setting = await this.service.upsert(key, dto.value);
    return { data: setting };
  }
}
