import { Controller, Get, Post, Param, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { PortalService } from "./portal.service";
import { PayInvoiceDto } from "./dto/pay-invoice.dto";
import { CustomerJwtAuthGuard } from "../portal-auth/guards/customer-jwt-auth.guard";

@ApiTags("portal")
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller("portal")
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Get("me")
  @ApiOperation({ summary: "Profil pelanggan yang sedang login" })
  getProfile(@Req() req: any) {
    return this.service.getProfile(req.user.customerId);
  }

  @Get("invoices")
  @ApiOperation({ summary: "Daftar tagihan milik pelanggan yang sedang login" })
  getMyInvoices(@Req() req: any) {
    return this.service.getMyInvoices(req.user.customerId);
  }

  @Get("invoices/:id")
  @ApiOperation({ summary: "Detail satu tagihan -- hanya bisa diakses jika milik pelanggan sendiri" })
  getInvoiceDetail(@Req() req: any, @Param("id") id: string) {
    return this.service.getMyInvoiceDetail(req.user.customerId, id);
  }

  @Post("invoices/:id/pay")
  @ApiOperation({ summary: "Mulai pembayaran untuk tagihan milik sendiri (verifikasi kepemilikan otomatis)" })
  payInvoice(@Req() req: any, @Param("id") id: string, @Body() dto: PayInvoiceDto) {
    return this.service.payInvoice(req.user.customerId, id, dto.paymentMethod);
  }
}
