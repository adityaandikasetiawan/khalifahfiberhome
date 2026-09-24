import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PortalService } from "./portal.service";
import { PayInvoiceDto } from "./dto/pay-invoice.dto";

/**
 * Endpoint PUBLIK pembayaran via magic-link (tanpa login). Keamanan bergantung
 * pada payToken acak (24 byte) yang hanya diketahui pemilik invoice lewat
 * email/WA. Hanya mengizinkan aksi membayar tagihan sendiri.
 */
@ApiTags("public-pay")
@Controller("pay")
export class PublicPayController {
  constructor(private readonly service: PortalService) {}

  @Get("lookup")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Cek tagihan belum lunas via nomor pelanggan / HP (tanpa login)" })
  lookup(@Query("q") q: string) {
    return this.service.lookupInvoices(q);
  }

  @Get(":token")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Detail tagihan via magic-link (tanpa login)" })
  detail(@Param("token") token: string) {
    return this.service.getInvoiceByToken(token);
  }

  @Post(":token")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: "Mulai pembayaran via magic-link (tanpa login)" })
  pay(@Param("token") token: string, @Body() dto: PayInvoiceDto) {
    return this.service.payByToken(token, dto.paymentMethod, dto.paymentChannel);
  }

  @Post(":token/check")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Cek status pembayaran via magic-link (tanpa login)" })
  check(@Param("token") token: string) {
    return this.service.checkByToken(token);
  }
}
