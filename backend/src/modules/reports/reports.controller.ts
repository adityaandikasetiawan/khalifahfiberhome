import { Controller, Get, Query, UseGuards, Res } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "finance")
@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("revenue")
  @ApiOperation({ summary: "Laporan pendapatan per bulan" })
  getRevenue(@Query("month") month?: string, @Query("year") year?: string) {
    return this.service.getRevenue(month ? Number(month) : undefined, year ? Number(year) : undefined);
  }

  @Get("revenue/chart")
  @ApiOperation({ summary: "Data chart pendapatan 12 bulan terakhir" })
  getRevenueChart() {
    return this.service.getRevenueChart();
  }

  @Get("revenue/export")
  @ApiOperation({ summary: "Export laporan pendapatan ke Excel (.xlsx)" })
  async exportRevenue(
    @Res() res: Response,
    @Query("month") month?: string,
    @Query("year") year?: string,
  ) {
    const buffer = await this.service.exportRevenueToExcel(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-pendapatan-${month ?? "current"}-${year ?? "current"}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get("overdue")
  @ApiOperation({ summary: "Daftar pelanggan dengan tagihan overdue" })
  getOverdueList() {
    return this.service.getOverdueList();
  }

  @Get("overdue/export")
  @ApiOperation({ summary: "Export daftar overdue ke Excel (.xlsx)" })
  async exportOverdue(@Res() res: Response) {
    const buffer = await this.service.exportOverdueToExcel();
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="daftar-overdue.xlsx"',
    });
    res.send(buffer);
  }

  @Get("revenue/export-pdf")
  @ApiOperation({ summary: "Export laporan pendapatan ke PDF" })
  async exportRevenuePdf(
    @Res() res: Response,
    @Query("month") month?: string,
    @Query("year") year?: string,
  ) {
    const buffer = await this.service.exportRevenueToPdf(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laporan-pendapatan-${month ?? "current"}-${year ?? "current"}.pdf"`,
    });
    res.send(buffer);
  }

  @Get("overdue/export-pdf")
  @ApiOperation({ summary: "Export daftar overdue ke PDF" })
  async exportOverduePdf(@Res() res: Response) {
    const buffer = await this.service.exportOverdueToPdf();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="daftar-overdue.pdf"',
    });
    res.send(buffer);
  }

  @Get("churn")
  @ApiOperation({ summary: "Ringkasan status pelanggan (aktif/suspended/terminated)" })
  getChurnSummary() {
    return this.service.getChurnSummary();
  }
}
