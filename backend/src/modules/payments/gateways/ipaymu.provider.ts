import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface IpaymuCreatePaymentParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod: "va" | "qris" | "ewallet";
  paymentChannel?: string;
  notifyUrl: string;
  returnUrl?: string;
}

export interface IpaymuPaymentResponse {
  Status: number;
  Url?: string;
  Data?: {
    SessionId?: string;
    TransactionId?: number;
    PaymentNo?: string;
    PaymentName?: string;
    Expired?: string;
    Total?: number;
  };
  Message?: string;
}

/**
 * Provider iPaymu Payment Gateway (API v2).
 *
 * Referensi: https://github.com/ipaymu/ipaymu-payment-v2-sample-nodejs
 *
 * Sandbox: https://sandbox.ipaymu.com/api/v2/payment/direct
 * Production: https://my.ipaymu.com/api/v2/payment/direct
 */
@Injectable()
export class IpaymuProvider {
  private readonly logger = new Logger(IpaymuProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get va(): string {
    return this.config.get<string>("IPAYMU_VA", "");
  }

  private get apiKey(): string {
    return this.config.get<string>("IPAYMU_API_KEY", "");
  }

  private get isProduction(): boolean {
    return this.config.get("IPAYMU_IS_PRODUCTION") === "true";
  }

  private get baseUrl(): string {
    return this.isProduction
      ? "https://my.ipaymu.com/api/v2"
      : "https://sandbox.ipaymu.com/api/v2";
  }

  /**
   * Generate signature iPaymu:
   * signature = HMAC-SHA256("POST:" + va + ":" + SHA256(jsonBody) + ":" + apiKey, apiKey)
   */
  private generateSignature(jsonBody: string): string {
    const bodyHash = crypto.createHash("sha256").update(jsonBody).digest("hex");
    const stringToSign = `POST:${this.va}:${bodyHash}:${this.apiKey}`;
    return crypto.createHmac("sha256", this.apiKey).update(stringToSign).digest("hex");
  }

  /**
   * Generate timestamp format YYYYMMDDHHmmss
   */
  private generateTimestamp(): string {
    const now = new Date();
    return now.getFullYear().toString()
      + String(now.getMonth() + 1).padStart(2, "0")
      + String(now.getDate()).padStart(2, "0")
      + String(now.getHours()).padStart(2, "0")
      + String(now.getMinutes()).padStart(2, "0")
      + String(now.getSeconds()).padStart(2, "0");
  }

  /**
   * Map payment method ke channel iPaymu.
   */
  private getChannel(method: string, channel?: string): string {
    if (channel) return channel;
    switch (method) {
      case "va": return "bca"; // default VA channel
      case "qris": return "qris";
      case "ewallet": return "shopeepay";
      default: return "bca";
    }
  }

  /**
   * Create direct payment transaction di iPaymu.
   */
  async createTransaction(params: IpaymuCreatePaymentParams): Promise<IpaymuPaymentResponse> {
    const body: Record<string, any> = {
      name: params.customerName,
      phone: params.customerPhone || "081200000000",
      email: params.customerEmail || "customer@isp.local",
      amount: params.amount,
      notifyUrl: params.notifyUrl,
      expired: 24, // expired dalam 24 jam
      comments: `Pembayaran invoice ${params.orderId}`,
      referenceId: params.orderId,
      paymentMethod: params.paymentMethod === "ewallet" ? "ewallet" : params.paymentMethod,
      paymentChannel: this.getChannel(params.paymentMethod, params.paymentChannel),
    };

    if (params.returnUrl) {
      body.returnUrl = params.returnUrl;
    }

    const jsonBody = JSON.stringify(body);
    const signature = this.generateSignature(jsonBody);
    const timestamp = this.generateTimestamp();

    const url = `${this.baseUrl}/payment/direct`;

    this.logger.log(`[iPaymu] Creating payment: ${params.orderId}, amount: ${params.amount}, method: ${params.paymentMethod}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        va: this.va,
        signature: signature,
        timestamp: timestamp,
      },
      body: jsonBody,
    });

    const result = await response.json() as IpaymuPaymentResponse;

    if (!response.ok || result.Status !== 200) {
      this.logger.error(`[iPaymu] Payment creation failed: ${JSON.stringify(result)}`);
      throw new Error(`iPaymu error: ${result.Message ?? "Unknown error"} (status ${result.Status})`);
    }

    this.logger.log(`[iPaymu] Payment created successfully: ${JSON.stringify(result.Data)}`);
    return result;
  }

  /**
   * Verifikasi callback/webhook dari iPaymu.
   * iPaymu mengirim notifikasi ke notifyUrl dengan POST body yang berisi
   * trx_id, reference_id, status, dll.
   *
   * Untuk verifikasi, kita check status_code dan cocokkan reference_id.
   */
  verifyCallback(payload: any): { isValid: boolean; orderId: string; status: "success" | "failed" } {
    // iPaymu callback fields:
    // trx_id, reference_id (our orderId), via, channel, status_code (1=berhasil, -1=expired)
    // status: berhasil / expired / pending
    const orderId = payload.reference_id || payload.referenceId || "";
    const statusCode = parseInt(payload.status_code ?? payload.StatusCode ?? "0", 10);

    let status: "success" | "failed" = "failed";
    if (statusCode === 1) {
      status = "success";
    }

    return {
      isValid: !!orderId,
      orderId,
      status,
    };
  }
}
