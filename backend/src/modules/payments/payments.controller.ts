import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
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

  @Get()
  @ApiOperation({ summary: "Histori pembayaran (admin) dengan filter status/tanggal/pencarian + paging" })
  findAll(
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.findAll({
      status,
      from,
      to,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("export")
  @ApiOperation({ summary: "Export histori pembayaran ke CSV (filter sama seperti list)" })
  async export(
    @Res() res: Response,
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("search") search?: string,
  ) {
    const csv = await this.service.exportCsv({ status, from, to, search });
    const filename = `pembayaran-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv); // BOM agar Excel membaca UTF-8 dengan benar
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
