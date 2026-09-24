import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RegistrationService } from "./registration.service";
import { RegisterDto } from "./dto/register.dto";
import { ApproveRegistrationDto } from "./dto/approve-registration.dto";

/**
 * Registrasi pelanggan baru. Endpoint publik: packages, register, verify.
 * Endpoint approval (list-pending, approve) butuh auth admin/teknisi.
 */
@ApiTags("registration")
@Controller("registrations")
export class RegistrationController {
  constructor(private readonly service: RegistrationService) {}

  @Get("packages")
  @ApiOperation({ summary: "Daftar paket aktif untuk form registrasi (publik)" })
  listPackages() {
    return this.service.listPackages();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Registrasi pelanggan baru + kirim email verifikasi" })
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Get("verify")
  @ApiOperation({ summary: "Verifikasi email via token, buat invoice registrasi" })
  verify(@Query("token") token: string) {
    return this.service.verifyEmail(token);
  }

  // ─── Endpoint approval (admin/teknisi) ─────────────────────────

  @Get("pending")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin", "technician", "finance")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Daftar registrasi menunggu approval teknisi" })
  listPending() {
    return this.service.listPendingApprovals();
  }

  @Post(":subscriptionId/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin", "technician")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve registrasi: buat PPPoE di router + aktifkan pelanggan" })
  approve(@Param("subscriptionId") subscriptionId: string, @Body() dto: ApproveRegistrationDto) {
    return this.service.approveRegistration(subscriptionId, dto);
  }
}
