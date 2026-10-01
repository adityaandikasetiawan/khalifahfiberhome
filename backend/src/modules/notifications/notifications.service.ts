import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { NotificationLog, NotificationType } from "./entities/notification-log.entity";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { WhatsAppService } from "./whatsapp.service";
import { EmailService } from "./email.service";
import { renderBrandedEmail, BrandInfo, EmailSection } from "./email-template";

const BRAND = "Khalifah Fiber Home";

// Baris rincian tagihan yang dipakai bersama (WhatsApp mendukung *tebal*).
function invoiceBlock(ctx: any): string {
  const lines = [
    `🧾 *No. Tagihan* : ${ctx.invoiceNumber}`,
    ctx.packageName ? `📦 *Paket*       : ${ctx.packageName}` : "",
    ctx.period ? `🗓️ *Periode*     : ${ctx.period}` : "",
    `📅 *Jatuh Tempo* : ${ctx.dueDate}`,
    `💰 *Total*       : Rp ${ctx.amount}`,
  ].filter(Boolean);
  return lines.join("\n");
}

const DIV = "━━━━━━━━━━━━━━━━━━━━";

const MESSAGE_TEMPLATES: Record<NotificationType, (ctx: any) => string> = {
  invoice_created: (ctx) =>
    `*TAGIHAN BARU* 🧾\n${DIV}\n` +
    `Halo *${ctx.customerName}*, tagihan internet Anda telah terbit.\n\n` +
    `${invoiceBlock(ctx)}\n${DIV}\n` +
    `💳 *Bayar sekarang* (tanpa login):\n${ctx.paymentLink}\n\n` +
    `Abaikan pesan ini jika sudah membayar. Terima kasih 🙏\n_${BRAND}_`,

  reminder_h3: (ctx) =>
    `*PENGINGAT PEMBAYARAN* ⏰\n${DIV}\n` +
    `Halo *${ctx.customerName}*, tagihan Anda akan *jatuh tempo dalam 3 hari*.\n\n` +
    `${invoiceBlock(ctx)}\n${DIV}\n` +
    `💳 *Bayar sekarang*:\n${ctx.paymentLink}\n\n` +
    `Mohon siapkan pembayaran ya. Terima kasih 🙏\n_${BRAND}_`,

  reminder_h1: (ctx) =>
    `*JATUH TEMPO BESOK* ⏰\n${DIV}\n` +
    `Halo *${ctx.customerName}*, tagihan Anda *jatuh tempo besok*.\n\n` +
    `${invoiceBlock(ctx)}\n${DIV}\n` +
    `💳 *Bayar sekarang*:\n${ctx.paymentLink}\n\n` +
    `Bayar sebelum jatuh tempo agar layanan tetap aktif 🙏\n_${BRAND}_`,

  overdue: (ctx) =>
    `*TAGIHAN TERLAMBAT* ⚠️\n${DIV}\n` +
    `Halo *${ctx.customerName}*, tagihan Anda telah *melewati jatuh tempo*.\n\n` +
    `${invoiceBlock(ctx)}\n${DIV}\n` +
    `💳 *Segera bayar* untuk menghindari pemutusan layanan:\n${ctx.paymentLink}\n\n` +
    `_${BRAND}_`,

  isolir: (ctx) =>
    `*LAYANAN DINONAKTIFKAN* 🔌\n${DIV}\n` +
    `Halo *${ctx.customerName}*, mohon maaf layanan internet Anda kami *nonaktifkan sementara* karena tunggakan tagihan *${ctx.invoiceNumber}*.\n\n` +
    `💳 *Bayar untuk aktif kembali* (otomatis):\n${ctx.paymentLink}\n\n` +
    `Layanan aktif kembali segera setelah pembayaran diterima 🙏\n_${BRAND}_`,

  payment_success: (ctx) =>
    `*PEMBAYARAN DITERIMA* ✅\n${DIV}\n` +
    `Halo *${ctx.customerName}*, terima kasih! Pembayaran Anda telah kami terima.\n\n` +
    `🧾 *No. Tagihan* : ${ctx.invoiceNumber}\n` +
    `💰 *Dibayar*     : Rp ${ctx.amount}\n${DIV}\n` +
    `Layanan Anda aktif. Terima kasih telah berlangganan 🙏\n_${BRAND}_`,
};

const EMAIL_SUBJECTS: Record<NotificationType, (ctx: any) => string> = {
  invoice_created: (ctx) => `Tagihan ${ctx.invoiceNumber} telah terbit`,
  reminder_h3: (ctx) => `Pengingat: tagihan ${ctx.invoiceNumber} jatuh tempo 3 hari lagi`,
  reminder_h1: (ctx) => `Pengingat: tagihan ${ctx.invoiceNumber} jatuh tempo besok`,
  overdue: (ctx) => `Tagihan ${ctx.invoiceNumber} telah lewat jatuh tempo`,
  isolir: () => `Layanan internet Anda dinonaktifkan sementara`,
  payment_success: (ctx) => `Pembayaran tagihan ${ctx.invoiceNumber} diterima`,
};

// Tema visual (emoji + warna aksen + judul badge) per tipe notifikasi.
const EMAIL_THEME: Record<NotificationType, { emoji: string; accent: string; heading: string }> = {
  invoice_created: { emoji: "🧾", accent: "#2563eb", heading: "Tagihan Baru" },
  reminder_h3: { emoji: "⏰", accent: "#d97706", heading: "Pengingat Pembayaran" },
  reminder_h1: { emoji: "⏰", accent: "#d97706", heading: "Jatuh Tempo Besok" },
  overdue: { emoji: "⚠️", accent: "#dc2626", heading: "Tagihan Terlambat" },
  isolir: { emoji: "🔌", accent: "#dc2626", heading: "Layanan Dinonaktifkan" },
  payment_success: { emoji: "✅", accent: "#16a34a", heading: "Pembayaran Diterima" },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog) private readonly repo: Repository<NotificationLog>,
    @InjectRepository(SiteSetting) private readonly settingRepo: Repository<SiteSetting>,
    private readonly whatsAppService: WhatsAppService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  /** Ambil info brand dari site_settings.company (fallback ke default). */
  private async getBrand(): Promise<BrandInfo> {
    let company: any = {};
    try {
      const s = await this.settingRepo.findOne({ where: { key: "company" } });
      company = s?.value ?? {};
    } catch {
      /* abaikan, pakai fallback */
    }
    return {
      name: company.name || "Khalifah Fiber Home",
      tagline: company.tagline,
      phone: company.phone,
      whatsapp: company.whatsapp,
      address: company.address,
      email: company.email,
      logoUrl: this.config.get("EMAIL_LOGO_URL") || undefined,
    };
  }

  /** Susun konten email branded per tipe. */
  private buildSection(type: NotificationType, ctx: any): EmailSection {
    const theme = EMAIL_THEME[type];
    // Callout "atur password" hanya untuk pelanggan lama yang belum punya
    // password (ctx.resetPassword terisi). Muncul di email invoice/pengingat.
    const callout =
      ctx.resetPassword && ["invoice_created", "reminder_h3", "reminder_h1", "overdue"].includes(type)
        ? {
            title: "🔐 Aktifkan Login Portal Anda",
            html: `Username: <b>${ctx.resetPassword.username}</b><br/>Silakan atur password portal Anda: <a href="${ctx.resetPassword.url}" style="color:#92400e;text-decoration:underline">Atur Password</a><br/><span style="font-size:12px">Setelah password diatur, info ini tidak muncul lagi di tagihan berikutnya.</span>`,
          }
        : undefined;

    const base: EmailSection = {
      greetingName: ctx.customerName,
      heading: theme.heading,
      accent: theme.accent,
      emoji: theme.emoji,
      intro: MESSAGE_TEMPLATES[type](ctx),
      callout,
    };

    const invoiceRows = [
      { label: "No. Tagihan", value: ctx.invoiceNumber ?? "-" },
      ...(ctx.period ? [{ label: "Periode", value: ctx.period }] : []),
      ...(ctx.dueDate ? [{ label: "Jatuh Tempo", value: ctx.dueDate }] : []),
    ];

    switch (type) {
      case "invoice_created":
        return {
          ...base,
          intro: "Tagihan layanan internet Anda telah terbit. Berikut rinciannya:",
          rows: invoiceRows,
          amount: ctx.amount ? `Rp ${ctx.amount}` : undefined,
          amountLabel: "Total Tagihan",
          buttonText: ctx.paymentLink ? "Bayar Sekarang" : undefined,
          buttonUrl: ctx.paymentLink,
          note: "Abaikan email ini jika Anda sudah membayar.",
        };
      case "reminder_h3":
      case "reminder_h1":
        return {
          ...base,
          intro:
            type === "reminder_h1"
              ? "Tagihan Anda jatuh tempo besok. Mohon segera lakukan pembayaran."
              : "Tagihan Anda akan jatuh tempo dalam 3 hari. Mohon siapkan pembayaran.",
          rows: invoiceRows,
          amount: ctx.amount ? `Rp ${ctx.amount}` : undefined,
          amountLabel: "Total Tagihan",
          buttonText: ctx.paymentLink ? "Bayar Sekarang" : undefined,
          buttonUrl: ctx.paymentLink,
        };
      case "overdue":
        return {
          ...base,
          intro:
            "Tagihan Anda telah melewati jatuh tempo. Mohon segera lakukan pembayaran untuk menghindari pemutusan layanan.",
          rows: invoiceRows,
          amount: ctx.amount ? `Rp ${ctx.amount}` : undefined,
          amountLabel: "Total Tagihan",
          buttonText: ctx.paymentLink ? "Bayar Sekarang" : undefined,
          buttonUrl: ctx.paymentLink,
        };
      case "isolir":
        return {
          ...base,
          intro:
            "Mohon maaf, layanan internet Anda dinonaktifkan sementara karena tunggakan. Layanan akan aktif kembali otomatis setelah pembayaran diterima.",
          rows: invoiceRows,
          buttonText: ctx.paymentLink ? "Bayar & Aktifkan Kembali" : undefined,
          buttonUrl: ctx.paymentLink,
        };
      case "payment_success":
        return {
          ...base,
          intro: "Terima kasih! Pembayaran Anda telah kami terima.",
          rows: invoiceRows,
          amount: ctx.amount ? `Rp ${ctx.amount}` : undefined,
          amountLabel: "Jumlah Dibayar",
        };
      default:
        return base;
    }
  }

  async sendAndLog(params: {
    customerId: string;
    invoiceId?: string;
    phone: string;
    email?: string;
    type: NotificationType;
    context: Record<string, any>;
  }) {
    await Promise.all([this.sendWhatsApp(params), this.sendEmail(params)]);
  }

  private async sendWhatsApp(params: {
    customerId: string;
    invoiceId?: string;
    phone: string;
    type: NotificationType;
    context: Record<string, any>;
  }) {
    if (!params.phone) return;
    // Cegah WA duplikat untuk (invoice, type) yang sama.
    if (await this.alreadySent(params.invoiceId, params.type, "whatsapp")) {
      this.logger.log(`WA ${params.type} untuk invoice ${params.invoiceId} sudah pernah terkirim, skip`);
      return;
    }
    let message = MESSAGE_TEMPLATES[params.type](params.context);
    // Sisipkan info atur password untuk pelanggan lama yang belum punya password.
    const rp = params.context.resetPassword;
    if (rp && ["invoice_created", "reminder_h3", "reminder_h1", "overdue"].includes(params.type)) {
      message += `\n\n🔐 *Aktifkan Login Portal Anda*\n👤 Username: ${rp.username}\n🔗 Atur password: ${rp.url}`;
    }
    try {
      await this.whatsAppService.sendMessage(params.phone, message);
      await this.logResult(params, "whatsapp", "sent");
    } catch (err) {
      const msg = (err as Error).message ?? "";
      this.logger.error(`Gagal kirim WA ${params.type} ke ${params.phone}`, err as Error);
      // Kegagalan SEMENTARA (gateway belum siap, mis. sedang initializing setelah
      // restart): lempar ulang agar BullMQ me-retry job ini nanti saat gateway ready.
      // Jangan catat "failed" permanen supaya tidak menghalangi retry (alreadySent).
      if (/belum siap|not ready|initializing|disconnected/i.test(msg)) {
        throw err;
      }
      // Kegagalan PERMANEN (nomor tak terdaftar, dll): catat failed, jangan retry.
      await this.logResult(params, "whatsapp", "failed", msg);
    }
  }

  private async sendEmail(params: {
    customerId: string;
    invoiceId?: string;
    email?: string;
    type: NotificationType;
    context: Record<string, any>;
  }) {
    if (!params.email) return;
    if (!this.emailService.isConfigured()) return;
    // Cegah email duplikat untuk (invoice, type) yang sama — melindungi dari
    // job scheduler yang jalan dua kali atau retry.
    if (await this.alreadySent(params.invoiceId, params.type, "email")) {
      this.logger.log(`Email ${params.type} untuk invoice ${params.invoiceId} sudah pernah terkirim, skip`);
      return;
    }
    try {
      const brand = await this.getBrand();
      const html = renderBrandedEmail(brand, this.buildSection(params.type, params.context));
      const result = await this.emailService.sendEmail({
        to: params.email,
        toName: params.context.customerName,
        subject: EMAIL_SUBJECTS[params.type](params.context),
        htmlContent: html,
      });
      if (result.skipped) return;
      await this.logResult(params, "email", "sent");
    } catch (err) {
      this.logger.error(`Gagal kirim Email ${params.type} ke ${params.email}`, err as Error);
      await this.logResult(params, "email", "failed", (err as Error).message);
    }
  }

  /**
   * Cek apakah notifikasi (invoiceId, type, channel) sudah pernah TERKIRIM
   * sukses. Dipakai sebagai guard anti-duplikat. Kalau invoiceId tidak ada
   * (mis. broadcast tanpa invoice), tidak melakukan dedup.
   */
  private async alreadySent(
    invoiceId: string | undefined,
    type: NotificationType,
    channel: "whatsapp" | "email",
  ): Promise<boolean> {
    if (!invoiceId) return false;
    const existing = await this.repo.findOne({
      where: { invoiceId, type, channel, status: "sent" },
    });
    return !!existing;
  }

  private async logResult(
    params: { customerId: string; invoiceId?: string; type: NotificationType },
    channel: "whatsapp" | "email",
    status: "sent" | "failed",
    errorMessage?: string,
  ) {
    await this.repo.save(
      this.repo.create({
        customerId: params.customerId,
        invoiceId: params.invoiceId,
        channel,
        type: params.type,
        status,
        errorMessage,
      }),
    );
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { sentAt: "DESC" } });
  }

  /**
   * Kirim notifikasi WA ke ADMIN setiap ada pembayaran pelanggan masuk.
   * Mendukung beberapa nomor admin (dipisah koma). Dilempar ulang jika gateway
   * belum siap supaya job di-retry BullMQ (konsisten dgn sendWhatsApp).
   */
  async sendAdminPaymentAlert(data: {
    adminNumbers: string;
    amount: number;
    invoiceNumber?: string;
    customerName?: string;
    customerNumber?: string;
    paidAt?: string;
  }) {
    const numbers = (data.adminNumbers || "")
      .split(",")
      .map((n) => this.normalizePhone(n))
      .filter(Boolean);
    if (numbers.length === 0) return;

    const amount = Number(data.amount).toLocaleString("id-ID");
    const waktu = data.paidAt
      ? new Date(data.paidAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
      : new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    const message =
      `💰 *Pembayaran Masuk*\n\n` +
      `👤 Pelanggan: ${data.customerName ?? "-"}${data.customerNumber ? ` (${data.customerNumber})` : ""}\n` +
      `🧾 Invoice: ${data.invoiceNumber ?? "-"}\n` +
      `💵 Jumlah: Rp ${amount}\n` +
      `🕒 Waktu: ${waktu}`;

    for (const num of numbers) {
      try {
        await this.whatsAppService.sendMessage(num, message);
        this.logger.log(`Alert pembayaran dikirim ke admin ${num}`);
      } catch (err) {
        const msg = (err as Error).message ?? "";
        this.logger.error(`Gagal kirim alert pembayaran ke admin ${num}`, err as Error);
        // Kegagalan sementara (gateway belum siap) -> lempar agar job di-retry.
        if (/belum siap|not ready|initializing|disconnected/i.test(msg)) {
          throw err;
        }
        // Kegagalan permanen (nomor admin salah) -> jangan retry, cukup log.
      }
    }
  }

  /** Normalisasi nomor ke format 62xxxxxxxxxx (buang spasi, strip, + dan 0 depan). */
  private normalizePhone(raw: string): string {
    let n = (raw || "").replace(/[\s\-()]/g, "").trim();
    if (!n) return "";
    if (n.startsWith("+")) n = n.slice(1);
    if (n.startsWith("0")) n = "62" + n.slice(1);
    if (!n.startsWith("62")) n = "62" + n;
    return n;
  }
}
