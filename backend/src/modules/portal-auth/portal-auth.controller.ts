import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PortalAuthService } from "./portal-auth.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";

@ApiTags("portal-auth")
@Controller("portal/auth")
export class PortalAuthController {
  constructor(private readonly service: PortalAuthService) {}

  @Post("request-otp")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Kirim kode OTP login ke nomor WhatsApp pelanggan terdaftar" })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.service.requestOtp(dto.phone);
  }

  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Verifikasi kode OTP, mengembalikan JWT khusus portal pelanggan" })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.service.verifyOtp(dto.phone, dto.otp);
  }
}
