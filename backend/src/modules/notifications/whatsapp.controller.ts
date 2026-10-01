import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { WhatsAppService } from "./whatsapp.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

class SendTestDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

@ApiTags("whatsapp-gateway")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
@Controller("whatsapp")
export class WhatsAppController {
  constructor(private readonly wa: WhatsAppService) {}

  @Get("status")
  @ApiOperation({ summary: "Status koneksi WhatsApp gateway + QR code (jika perlu scan)" })
  getStatus() {
    // Return objek langsung; TransformInterceptor akan membungkus jadi { success, data }
    return this.wa.getStatus();
  }

  @Post("connect")
  @ApiOperation({ summary: "Mulai / inisialisasi sesi WhatsApp (webjs) untuk menghasilkan QR" })
  async connect() {
    await this.wa.initWebJs();
    return this.wa.getStatus();
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout & hapus sesi WhatsApp gateway" })
  async logout() {
    await this.wa.logout();
    return { status: "disconnected" };
  }

  @Post("send-test")
  @ApiOperation({ summary: "Kirim pesan test untuk memverifikasi gateway" })
  async sendTest(@Body() dto: SendTestDto) {
    await this.wa.sendMessage(dto.phone, dto.message, dto.imageUrl);
    return { sent: true };
  }
}
