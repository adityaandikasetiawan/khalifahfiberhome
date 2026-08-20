import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Contoh provider Midtrans (Snap API). Ganti implementasi fetch di bawah
 * dengan SDK resmi midtrans-client bila diperlukan.
 */
@Injectable()
export class MidtransProvider {
  constructor(private readonly config: ConfigService) {}

  async createTransaction(params: { orderId: string; amount: number; customerName: string }) {
    const serverKey = this.config.get<string>("MIDTRANS_SERVER_KEY");
    const isProduction = this.config.get("MIDTRANS_IS_PRODUCTION") === "true";
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const auth = Buffer.from(`${serverKey}:`).toString("base64");

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: params.orderId, gross_amount: params.amount },
        customer_details: { first_name: params.customerName },
      }),
    });

    if (!response.ok) {
      throw new Error(`Midtrans error: ${response.status} ${await response.text()}`);
    }

    return response.json(); // { token, redirect_url }
  }

  /**
   * Verifikasi signature notifikasi Midtrans:
   * signature = SHA512(order_id + status_code + gross_amount + server_key)
   */
  async verifySignature(payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): Promise<boolean> {
    const crypto = await import("crypto");
    const serverKey = this.config.get<string>("MIDTRANS_SERVER_KEY");
    const expected = crypto
      .createHash("sha512")
      .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
      .digest("hex");
    return expected === payload.signature_key;
  }
}
