import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { PaymentsService } from "./payments.service";
import { CreatePaymentTransactionDto } from "./dto/create-payment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

class SimulateOutcomeDto {
  @IsIn(["success", "failed"])
  outcome: "success" | "failed";
}

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post("create-transaction")
  @ApiOperation({ summary: "Buat transaksi pembayaran (VA/QRIS/e-wallet) untuk sebuah invoice" })
  createTransaction(@Body() dto: CreatePaymentTransactionDto) {
    return this.service.createTransaction(dto);
  }

  @Get("invoice/:invoiceId")
  @ApiOperation({ summary: "Riwayat percobaan pembayaran untuk sebuah invoice" })
  findByInvoice(@Param("invoiceId") invoiceId: string) {
    return this.service.findByInvoice(invoiceId);
  }

  @Post("mock/:paymentId/simulate")
  @ApiOperation({
    summary: "[DEV ONLY] Simulasikan hasil pembayaran mock -- hanya aktif kalau PAYMENT_PROVIDER=mock",
  })
  simulateMockPayment(@Param("paymentId") paymentId: string, @Body() dto: SimulateOutcomeDto) {
    return this.service.simulateMockPayment(paymentId, dto.outcome);
  }
}
