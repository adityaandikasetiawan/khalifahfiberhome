import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Pengiriman email transaksional via Brevo (dulu Sendinblue).
 * Endpoint: POST https://api.brevo.com/v3/smtp/email  (header "api-key").
 *
 * Konfigurasi via env:
 *   BREVO_API_KEY       — API key Brevo (Settings > SMTP & API > API Keys)
 *   BREVO_SENDER_EMAIL  — alamat pengirim terverifikasi di Brevo
 *   BREVO_SENDER_NAME   — nama pengirim (opsional, default "ISP Billing")
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private static readonly ENDPOINT = "https://api.brevo.com/v3/smtp/email";

  constructor(private readonly config: ConfigService) {}

  /** Apakah kredensial Brevo tersedia? */
  isConfigured(): boolean {
    return Boolean(this.config.get("BREVO_API_KEY") && this.config.get("BREVO_SENDER_EMAIL"));
  }

  /**
   * Kirim satu email. Melempar error jika gagal (agar pemanggil bisa mencatat
   * status "failed"). Tidak melempar jika Brevo belum dikonfigurasi — cukup skip.
   */
  async sendEmail(params: {
    to: string;
    toName?: string;
    subject: string;
    htmlContent: string;
  }): Promise<{ sent: boolean; skipped?: boolean; messageId?: string }> {
    if (!this.isConfigured()) {
      this.logger.warn("BREVO_API_KEY/BREVO_SENDER_EMAIL belum diset — email dilewati");
      return { sent: false, skipped: true };
    }
    if (!params.to) {
      return { sent: false, skipped: true };
    }

    const apiKey = this.config.get<string>("BREVO_API_KEY")!;
    const senderEmail = this.config.get<string>("BREVO_SENDER_EMAIL")!;
    const senderName = this.config.get<string>("BREVO_SENDER_NAME") ?? "ISP Billing";

    const body = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.to, name: params.toName || params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
    };

    const res = await fetch(EmailService.ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Brevo gagal (${res.status}): ${text.slice(0, 300)}`);
    }

    const data: any = await res.json().catch(() => ({}));
    return { sent: true, messageId: data?.messageId };
  }
}
