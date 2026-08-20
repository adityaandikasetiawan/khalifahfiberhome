import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Contoh provider Xendit (Virtual Account / QRIS). Ganti implementasi fetch
 * di bawah dengan SDK resmi xendit-node bila diperlukan.
 */
@Injectable()
export class XenditProvider {
  constructor(private readonly config: ConfigService) {}

  private authHeader() {
    const secretKey = this.config.get<string>("XENDIT_SECRET_KEY");
    return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  }

  async createVirtualAccount(params: { externalId: string; amount: number; bankCode: string; name: string }) {
    const response = await fetch("https://api.xendit.co/callback_virtual_accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: this.authHeader() },
      body: JSON.stringify({
        external_id: params.externalId,
        bank_code: params.bankCode,
        name: params.name,
        expected_amount: params.amount,
        is_closed: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Xendit error: ${response.status} ${await response.text()}`);
    }
    return response.json();
  }

  /**
   * Verifikasi webhook token Xendit (dikirim di header x-callback-token).
   */
  verifyCallbackToken(receivedToken: string): boolean {
    const expected = this.config.get<string>("XENDIT_WEBHOOK_TOKEN");
    return receivedToken === expected;
  }
}
