import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
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

  @Post('upload-image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload gambar (maks 5MB) -> auto convert WebP, return URL' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(jpeg|jpg|png|webp|gif|avif)$/.test(file.mimetype)) {
          return cb(new BadRequestException('File harus berupa gambar (JPG/PNG/WebP/GIF/AVIF)'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: { buffer: Buffer; mimetype: string; size: number }) {
    if (!file) throw new BadRequestException('File gambar wajib diunggah');
    const url = await this.service.saveImageAsWebp(file.buffer);
    return { data: { url } };
  }
}
