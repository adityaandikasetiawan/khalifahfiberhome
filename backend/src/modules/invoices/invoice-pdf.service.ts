import { Injectable } from "@nestjs/common";
import * as PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import { Invoice } from "./entities/invoice.entity";
import { SiteSettingsService } from "../site-settings/site-settings.service";

/**
 * Membuat PDF invoice (tagihan) satu halaman dengan kop + logo perusahaan,
 * detail pelanggan, rincian item, total, dan status pembayaran.
 */
@Injectable()
export class InvoicePdfService {
  // Warna brand (hijau Khalifah Fiber Home).
  private readonly BRAND = "#0F6E56";
  private readonly INK = "#222222";
  private readonly MUTED = "#777777";

  // Cache buffer logo yang sudah diperkecil agar tidak diproses ulang tiap request.
  private logoBuffer: Buffer | null | undefined;

  constructor(private readonly siteSettings: SiteSettingsService) {}

  /** Cari file logo brand di beberapa lokasi yang mungkin. Null jika tak ada. */
  private resolveLogoPath(): string | null {
    const candidates = [
      path.join(process.cwd(), "..", "frontend", "public", "logo.png"),
      path.join(process.cwd(), "..", "public", "upload", "logo", "Khalifah_Fiberhome_Green_Logo.png"),
      path.join(process.cwd(), "public", "uploads", "logo.png"),
    ];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return p;
      } catch {
        /* ignore */
      }
    }
    return null;
  }

  /**
   * Logo brand yang sudah diperkecil (lebar maks 240px) agar PDF ringan.
   * Hasilnya di-cache di memori. Null bila logo tak ada / gagal diproses.
   */
  private async getLogoBuffer(): Promise<Buffer | null> {
    if (this.logoBuffer !== undefined) return this.logoBuffer ?? null;
    const p = this.resolveLogoPath();
    if (!p) {
      this.logoBuffer = null;
      return null;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require("sharp");
      this.logoBuffer = await sharp(p).resize({ width: 240, withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
    } catch {
      // Fallback: pakai file asli bila sharp gagal.
      try {
        this.logoBuffer = fs.readFileSync(p);
      } catch {
        this.logoBuffer = null;
      }
    }
    return this.logoBuffer ?? null;
  }

  private rupiah(n: number | string): string {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
  }

  private tanggal(d?: Date | string | null): string {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  }

  private statusLabel(s: string): { label: string; color: string } {
    switch (s) {
      case "paid":
        return { label: "LUNAS", color: "#16a34a" };
      case "overdue":
        return { label: "JATUH TEMPO", color: "#dc2626" };
      case "cancelled":
        return { label: "DIBATALKAN", color: "#777777" };
      default:
        return { label: "BELUM BAYAR", color: "#d97706" };
    }
  }

  async generate(invoice: Invoice): Promise<Buffer> {
    const company = (await this.siteSettings.getByKey("company")) ?? {};
    const companyName = company.name ?? "Khalifah Fiber Home";
    const companyAddr = company.address ?? "";
    const companyPhone = company.phone ?? company.whatsapp ?? "";
    const companyEmail = company.email ?? "";

    const customer = invoice.subscription?.customer;
    const items = invoice.items ?? [];
    const st = this.statusLabel(invoice.status);
    const logoBuf = await this.getLogoBuffer();

    // Catatan pembayaran (mis. "Transfer BCA a/n Budi", "Tunai ke Rigendi")
    // dari pembayaran sukses — untuk tracking pembayaran manual.
    const payments = ((invoice as any).payments ?? []) as any[];
    const paidPayment = payments.find((p) => p.status === "success") ?? payments[payments.length - 1];
    const paymentNote: string | undefined = paidPayment?.rawPayload?.note || undefined;
    const isManualPayment = paidPayment?.rawPayload?.manual === true;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const contentW = right - left;

      // ── KOP: logo + nama/alamat perusahaan ──────────────────────────
      const headerTop = 40;
      if (logoBuf) {
        try {
          doc.image(logoBuf, left, headerTop, { fit: [120, 48] });
        } catch {
          /* abaikan logo bila gagal dimuat */
        }
      }
      // Teks perusahaan di sisi kanan kop.
      doc.fontSize(15).fillColor(this.BRAND).font("Helvetica-Bold").text(companyName, left + 140, headerTop, {
        width: contentW - 140,
        align: "right",
      });
      doc.font("Helvetica").fontSize(8).fillColor(this.MUTED);
      if (companyAddr) doc.text(companyAddr, left + 140, doc.y + 2, { width: contentW - 140, align: "right" });
      const kontak = [companyPhone, companyEmail].filter(Boolean).join("  •  ");
      if (kontak) doc.text(kontak, { width: contentW - 140, align: "right" });

      // Garis pemisah kop.
      const lineY = Math.max(headerTop + 56, doc.y + 8);
      doc.moveTo(left, lineY).lineTo(right, lineY).lineWidth(1).strokeColor(this.BRAND).stroke();

      // ── Judul INVOICE + nomor + status ──────────────────────────────
      let y = lineY + 16;
      doc.fontSize(20).fillColor(this.INK).font("Helvetica-Bold").text("INVOICE", left, y);
      doc.fontSize(10).fillColor(this.MUTED).font("Helvetica").text(`No. ${invoice.invoiceNumber}`, left, doc.y + 2);

      // Badge status (kanan atas, sejajar judul).
      const badgeW = 120;
      const badgeX = right - badgeW;
      doc.roundedRect(badgeX, y + 2, badgeW, 24, 4).fillColor(st.color).fill();
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11).text(st.label, badgeX, y + 9, {
        width: badgeW,
        align: "center",
      });

      // ── Info pelanggan + tanggal (2 kolom) ──────────────────────────
      y = doc.y + 18;
      const colW = contentW / 2;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(this.BRAND).text("DITAGIHKAN KEPADA", left, y);
      doc.font("Helvetica").fontSize(10).fillColor(this.INK);
      doc.text(customer?.name ?? "-", left, doc.y + 3, { width: colW - 10 });
      doc.fontSize(8.5).fillColor(this.MUTED);
      if (customer?.customerNumber) doc.text(`No. Pelanggan: ${customer.customerNumber}`, { width: colW - 10 });
      if (customer?.phone) doc.text(`HP/WA: ${customer.phone}`, { width: colW - 10 });
      if (customer?.address) doc.text(customer.address, { width: colW - 10 });
      const leftColBottom = doc.y;

      // Kolom kanan: tanggal-tanggal.
      const rx = left + colW + 10;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(this.BRAND).text("DETAIL TAGIHAN", rx, y);
      const detailRow = (k: string, v: string) => {
        const ry = doc.y + 3;
        doc.font("Helvetica").fontSize(8.5).fillColor(this.MUTED).text(k, rx, ry, { width: 90 });
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(this.INK).text(v, rx + 90, ry, { width: colW - 100, align: "right" });
      };
      detailRow("Terbit", this.tanggal((invoice as any).createdAt));
      detailRow("Jatuh Tempo", this.tanggal(invoice.dueDate));
      detailRow("Masa Aktif", `${this.tanggal(invoice.periodStart)} – ${this.tanggal(invoice.periodEnd)}`);
      if (invoice.paidAt) detailRow("Dibayar", this.tanggal(invoice.paidAt));

      // ── Tabel item ──────────────────────────────────────────────────
      y = Math.max(leftColBottom, doc.y) + 20;
      const cDesc = left;
      const cQty = left + contentW * 0.6;
      const cPrice = left + contentW * 0.72;
      const cSub = right;

      // Header tabel.
      doc.rect(left, y, contentW, 22).fillColor(this.BRAND).fill();
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
      doc.text("Deskripsi", cDesc + 8, y + 7, { width: contentW * 0.58 });
      doc.text("Qty", cQty, y + 7, { width: contentW * 0.1, align: "center" });
      doc.text("Harga", cPrice, y + 7, { width: contentW * 0.14, align: "right" });
      doc.text("Subtotal", cPrice, y + 7, { width: cSub - cPrice - 8, align: "right" });
      // (Harga & Subtotal diselaraskan di baris isi di bawah.)

      y += 22;
      doc.font("Helvetica").fontSize(9).fillColor(this.INK);
      items.forEach((it, i) => {
        const rowH = 22;
        if (i % 2 === 1) {
          doc.rect(left, y, contentW, rowH).fillColor("#F3F6F5").fill();
        }
        doc.fillColor(this.INK).font("Helvetica").fontSize(9);
        doc.text(it.description, cDesc + 8, y + 6, { width: contentW * 0.56 });
        doc.text(String(it.qty), cQty, y + 6, { width: contentW * 0.1, align: "center" });
        doc.text(this.rupiah(it.unitPrice), left + contentW * 0.6, y + 6, {
          width: contentW * 0.18,
          align: "right",
        });
        doc.text(this.rupiah(it.subtotal), left, y + 6, { width: contentW - 8, align: "right" });
        y += rowH;
      });

      // Garis bawah tabel.
      doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor("#DDDDDD").stroke();

      // ── Total ───────────────────────────────────────────────────────
      y += 10;
      const totalBoxW = 200;
      const tbx = right - totalBoxW;
      const totalRow = (k: string, v: string, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 9);
        doc.fillColor(bold ? this.BRAND : this.MUTED).text(k, tbx, y, { width: 90 });
        doc.fillColor(bold ? this.BRAND : this.INK).text(v, tbx + 90, y, { width: totalBoxW - 90, align: "right" });
        y += bold ? 20 : 16;
      };
      const subtotalAll = items.reduce((s, it) => s + Number(it.subtotal || 0), 0);
      totalRow("Subtotal", this.rupiah(subtotalAll));
      if (Number((invoice as any).taxAmount) > 0) totalRow("Pajak", this.rupiah((invoice as any).taxAmount));
      doc.moveTo(tbx, y).lineTo(right, y).lineWidth(0.5).strokeColor("#DDDDDD").stroke();
      y += 8;
      totalRow("TOTAL", this.rupiah(invoice.totalAmount), true);

      // ── Catatan Pembayaran (tracking manual) ────────────────────────
      if (invoice.status === "paid" && paymentNote) {
        y += 8;
        const boxH = 44;
        doc.roundedRect(left, y, contentW, boxH, 4).fillColor("#F3F6F5").fill();
        doc.fillColor(this.BRAND).font("Helvetica-Bold").fontSize(9).text(
          `Catatan Pembayaran${isManualPayment ? " (Manual)" : ""}`,
          left + 10,
          y + 8,
        );
        doc.fillColor(this.INK).font("Helvetica").fontSize(9).text(paymentNote, left + 10, y + 23, {
          width: contentW - 20,
        });
        if (invoice.paidAt) {
          doc.fillColor(this.MUTED).fontSize(7.5).text(
            `Dibayar: ${this.tanggal(invoice.paidAt)}`,
            left + 10,
            y + boxH - 2,
            { width: contentW - 20, align: "right" },
          );
        }
        y += boxH + 4;
      }

      // ── Catatan kaki ────────────────────────────────────────────────
      const footY = doc.page.height - 90;
      doc.moveTo(left, footY).lineTo(right, footY).lineWidth(0.5).strokeColor("#DDDDDD").stroke();
      doc.font("Helvetica").fontSize(8).fillColor(this.MUTED);
      if (invoice.status === "paid") {
        doc.text("Invoice ini telah LUNAS. Terima kasih telah berlangganan.", left, footY + 8, {
          width: contentW,
          align: "center",
        });
      } else {
        doc.text(
          "Mohon lakukan pembayaran sebelum tanggal jatuh tempo untuk menghindari pemutusan layanan.",
          left,
          footY + 8,
          { width: contentW, align: "center" },
        );
      }
      doc.fillColor(this.MUTED).fontSize(7.5).text(
        `${companyName} — dokumen ini dibuat otomatis oleh sistem.`,
        left,
        footY + 24,
        { width: contentW, align: "center" },
      );

      doc.end();
    });
  }
}
