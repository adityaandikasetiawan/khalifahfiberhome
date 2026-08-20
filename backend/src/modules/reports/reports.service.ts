import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as ExcelJS from "exceljs";
import * as PDFDocument from "pdfkit";
import { Invoice } from "../invoices/entities/invoice.entity";
import { Customer } from "../customers/entities/customer.entity";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  async getRevenue(month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const result = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .select("COALESCE(SUM(invoice.totalAmount), 0)", "totalRevenue")
      .addSelect("COUNT(*)", "paidInvoiceCount")
      .where("invoice.status = :status", { status: "paid" })
      .andWhere("EXTRACT(MONTH FROM invoice.paidAt) = :m", { m })
      .andWhere("EXTRACT(YEAR FROM invoice.paidAt) = :y", { y })
      .getRawOne();

    return {
      month: m,
      year: y,
      totalRevenue: Number(result.totalRevenue),
      paidInvoiceCount: Number(result.paidInvoiceCount),
    };
  }

  /**
   * Pendapatan 12 bulan terakhir untuk chart di dashboard.
   */
  async getRevenueChart() {
    const results = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .select("EXTRACT(YEAR FROM invoice.paidAt)::int", "year")
      .addSelect("EXTRACT(MONTH FROM invoice.paidAt)::int", "month")
      .addSelect("COALESCE(SUM(invoice.totalAmount), 0)", "revenue")
      .addSelect("COUNT(*)::int", "count")
      .where("invoice.status = :status", { status: "paid" })
      .andWhere("invoice.paidAt >= NOW() - INTERVAL '12 months'")
      .groupBy("EXTRACT(YEAR FROM invoice.paidAt), EXTRACT(MONTH FROM invoice.paidAt)")
      .orderBy("EXTRACT(YEAR FROM invoice.paidAt)", "ASC")
      .addOrderBy("EXTRACT(MONTH FROM invoice.paidAt)", "ASC")
      .getRawMany();

    const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    return results.map((r: any) => ({
      label: `${MONTH_NAMES[r.month]} ${r.year}`,
      month: r.month,
      year: r.year,
      revenue: Number(r.revenue),
      count: Number(r.count),
    }));
  }

  async getOverdueList() {
    return this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .where("invoice.status = :status", { status: "overdue" })
      .orderBy("invoice.dueDate", "ASC")
      .getMany();
  }

  async getChurnSummary() {
    const [active, suspended, terminated] = await Promise.all([
      this.customerRepo.count({ where: { status: "active" } }),
      this.customerRepo.count({ where: { status: "suspended" } }),
      this.customerRepo.count({ where: { status: "terminated" } }),
    ]);
    return { active, suspended, terminated, total: active + suspended + terminated };
  }

  /**
   * Export laporan pendapatan bulanan (invoice lunas) ke file Excel.
   * Mengembalikan Buffer agar controller bisa langsung stream sebagai download.
   */
  async exportRevenueToExcel(month?: number, year?: number): Promise<Buffer> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const invoices = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .leftJoinAndSelect("subscription.package", "package")
      .where("invoice.status = :status", { status: "paid" })
      .andWhere("EXTRACT(MONTH FROM invoice.paidAt) = :m", { m })
      .andWhere("EXTRACT(YEAR FROM invoice.paidAt) = :y", { y })
      .orderBy("invoice.paidAt", "ASC")
      .getMany();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ISP Billing System";
    const sheet = workbook.addWorksheet(`Pendapatan ${m}-${y}`);

    sheet.columns = [
      { header: "No. Invoice", key: "invoiceNumber", width: 20 },
      { header: "Pelanggan", key: "customerName", width: 25 },
      { header: "Paket", key: "packageName", width: 20 },
      { header: "Tanggal Bayar", key: "paidAt", width: 18 },
      { header: "Total (Rp)", key: "totalAmount", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F6E56" } };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    let total = 0;
    for (const inv of invoices) {
      sheet.addRow({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.subscription?.customer?.name ?? "-",
        packageName: inv.subscription?.package?.name ?? "-",
        paidAt: inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("id-ID") : "-",
        totalAmount: Number(inv.totalAmount),
      });
      total += Number(inv.totalAmount);
    }

    sheet.addRow({});
    const totalRow = sheet.addRow({ customerName: "TOTAL", totalAmount: total });
    totalRow.font = { bold: true };
    sheet.getColumn("totalAmount").numFmt = "#,##0";

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Export daftar pelanggan overdue ke Excel -- dipakai finance/CS untuk
   * follow-up penagihan manual (telepon/WA) di luar sistem.
   */
  async exportOverdueToExcel(): Promise<Buffer> {
    const invoices = await this.getOverdueList();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ISP Billing System";
    const sheet = workbook.addWorksheet("Daftar Overdue");

    sheet.columns = [
      { header: "No. Invoice", key: "invoiceNumber", width: 20 },
      { header: "Pelanggan", key: "customerName", width: 25 },
      { header: "No. Telepon", key: "phone", width: 18 },
      { header: "Jatuh Tempo", key: "dueDate", width: 16 },
      { header: "Tagihan (Rp)", key: "totalAmount", width: 16 },
    ];
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F6E56" } };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    for (const inv of invoices) {
      sheet.addRow({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.subscription?.customer?.name ?? "-",
        phone: inv.subscription?.customer?.phone ?? "-",
        dueDate: new Date(inv.dueDate).toLocaleDateString("id-ID"),
        totalAmount: Number(inv.totalAmount),
      });
    }
    sheet.getColumn("totalAmount").numFmt = "#,##0";

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Export laporan pendapatan bulanan ke PDF -- format lebih cocok untuk
   * dicetak/dilampirkan ke laporan formal dibanding Excel.
   */
  async exportRevenueToPdf(month?: number, year?: number): Promise<Buffer> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const invoices = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .leftJoinAndSelect("subscription.package", "package")
      .where("invoice.status = :status", { status: "paid" })
      .andWhere("EXTRACT(MONTH FROM invoice.paidAt) = :m", { m })
      .andWhere("EXTRACT(YEAR FROM invoice.paidAt) = :y", { y })
      .orderBy("invoice.paidAt", "ASC")
      .getMany();

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];

    return this.buildPdf((doc) => {
      doc.fontSize(16).fillColor("#0F6E56").text("Laporan Pendapatan", { align: "left" });
      doc.fontSize(11).fillColor("#444444").text(`Periode: ${monthNames[m - 1]} ${y}`);
      doc.moveDown(1);

      const colX = { no: 40, inv: 75, cust: 220, pkg: 350, total: 460 };
      const headerY = doc.y;
      doc.fontSize(9).fillColor("#FFFFFF");
      doc.rect(40, headerY, 515, 20).fill("#0F6E56");
      doc.fillColor("#FFFFFF");
      doc.text("No", colX.no, headerY + 6, { width: 30 });
      doc.text("Invoice", colX.inv, headerY + 6, { width: 140 });
      doc.text("Pelanggan", colX.cust, headerY + 6, { width: 125 });
      doc.text("Paket", colX.pkg, headerY + 6, { width: 105 });
      doc.text("Total", colX.total, headerY + 6, { width: 90, align: "right" });

      let y2 = headerY + 20;
      let total = 0;
      doc.fillColor("#222222").fontSize(8.5);

      invoices.forEach((inv, i) => {
        if (y2 > 750) {
          doc.addPage();
          y2 = 40;
        }
        if (i % 2 === 0) {
          doc.rect(40, y2, 515, 18).fill("#F5F4EF");
          doc.fillColor("#222222");
        }
        doc.text(String(i + 1), colX.no, y2 + 5, { width: 30 });
        doc.text(inv.invoiceNumber, colX.inv, y2 + 5, { width: 140 });
        doc.text(inv.subscription?.customer?.name ?? "-", colX.cust, y2 + 5, { width: 125 });
        doc.text(inv.subscription?.package?.name ?? "-", colX.pkg, y2 + 5, { width: 105 });
        doc.text(`Rp ${Number(inv.totalAmount).toLocaleString("id-ID")}`, colX.total, y2 + 5, {
          width: 90,
          align: "right",
        });
        total += Number(inv.totalAmount);
        y2 += 18;
      });

      doc.moveTo(40, y2 + 4).lineTo(555, y2 + 4).strokeColor("#CCCCCC").stroke();
      doc.fontSize(10).fillColor("#0F6E56").font("Helvetica-Bold");
      doc.text("TOTAL PENDAPATAN", colX.cust, y2 + 12, { width: 200 });
      doc.text(`Rp ${total.toLocaleString("id-ID")}`, colX.total, y2 + 12, { width: 90, align: "right" });

      doc.font("Helvetica").fontSize(8).fillColor("#999999");
      doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")} -- ISP Billing System`, 40, 780, {
        lineBreak: false,
      });
    });
  }

  /**
   * Export daftar overdue ke PDF -- untuk dibawa tim penagihan lapangan.
   */
  async exportOverdueToPdf(): Promise<Buffer> {
    const invoices = await this.getOverdueList();

    return this.buildPdf((doc) => {
      doc.fontSize(16).fillColor("#993C1D").text("Daftar Tagihan Overdue", { align: "left" });
      doc.fontSize(11).fillColor("#444444").text(`Per tanggal: ${new Date().toLocaleDateString("id-ID")}`);
      doc.moveDown(1);

      const colX = { no: 40, inv: 75, cust: 220, phone: 360, due: 460, total: 480 };
      const headerY = doc.y;
      doc.rect(40, headerY, 515, 20).fill("#993C1D");
      doc.fillColor("#FFFFFF").fontSize(9);
      doc.text("No", colX.no, headerY + 6, { width: 30 });
      doc.text("Invoice", colX.inv, headerY + 6, { width: 140 });
      doc.text("Pelanggan", colX.cust, headerY + 6, { width: 135 });
      doc.text("Telepon", colX.phone, headerY + 6, { width: 95 });
      doc.text("Total", colX.total, headerY + 6, { width: 75, align: "right" });

      let y2 = headerY + 20;
      doc.fontSize(8.5);
      invoices.forEach((inv, i) => {
        if (y2 > 750) {
          doc.addPage();
          y2 = 40;
        }
        if (i % 2 === 0) {
          doc.rect(40, y2, 515, 18).fill("#FAECE7");
        }
        doc.fillColor("#222222");
        doc.text(String(i + 1), colX.no, y2 + 5, { width: 30 });
        doc.text(inv.invoiceNumber, colX.inv, y2 + 5, { width: 140 });
        doc.text(inv.subscription?.customer?.name ?? "-", colX.cust, y2 + 5, { width: 135 });
        doc.text(inv.subscription?.customer?.phone ?? "-", colX.phone, y2 + 5, { width: 95 });
        doc.text(`Rp ${Number(inv.totalAmount).toLocaleString("id-ID")}`, colX.total, y2 + 5, {
          width: 75,
          align: "right",
        });
        y2 += 18;
      });

      doc.fontSize(8).fillColor("#999999");
      doc.text(`Total ${invoices.length} tagihan overdue -- Dicetak: ${new Date().toLocaleString("id-ID")}`, 40, 780, {
        lineBreak: false,
      });
    });
  }

  private buildPdf(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      draw(doc);
      doc.end();
    });
  }
}
