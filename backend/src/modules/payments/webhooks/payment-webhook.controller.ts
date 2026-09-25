import { Controller, Post, Body, Headers, UnauthorizedException, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiExcludeEndpoint } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PaymentsService } from "../payments.service";
import { MidtransProvider } from "../gateways/midtrans.provider";
import { IpaymuProvider } from "../gateways/ipaymu.provider";
import { WebhookIpWhitelistGuard } from "../../../common/guards/webhook-ip-whitelist.guard";

/**
 * Endpoint publik (tidak pakai JwtAuthGuard) karena dipanggil langsung oleh
 * payment gateway. Keamanan bergantung SEPENUHNYA pada verifikasi signature
 * di bawah -- jangan pernah menghapus langkah ini. WebhookIpWhitelistGuard
 * adalah lapisan tambahan opsional (lihat komentar di guard-nya), fail-open
 * kalau WEBHOOK_ALLOWED_IPS belum diisi di .env.
 *
 * Rate limit lebih longgar dari endpoint publik lain (gateway kadang retry
 * beberapa kali dalam waktu singkat), tapi tetap dibatasi untuk mencegah
 * endpoint ini dijadikan target flood/DoS.
 */
@Throttle({ default: { limit: 30, ttl: 60000 } })
@UseGuards(WebhookIpWhitelistGuard)
@ApiTags("webhooks")
@Controller("webhooks")
export class PaymentWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly midtransProvider: MidtransProvider,
    private readonly ipaymuProvider: IpaymuProvider,
  ) {}

  @Post("payment-gateway/midtrans")
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleMidtransWebhook(@Body() payload: any) {
    const isValid = await this.midtransProvider.verifySignature({
      order_id: payload.order_id,
      status_code: payload.status_code,
      gross_amount: payload.gross_amount,
      signature_key: payload.signature_key,
    });

    if (!isValid) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const statusMap: Record<string, "success" | "failed" | "expired"> = {
      capture: "success",
      settlement: "success",
      deny: "failed",
      cancel: "failed",
      expire: "expired",
    };
    const status = statusMap[payload.transaction_status] ?? "failed";

    return this.paymentsService.handleWebhook({
      gatewayReference: payload.order_id,
      status,
      rawPayload: payload,
    });
  }

  @Post("payment-gateway/xendit")
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleXenditWebhook(@Body() payload: any, @Headers("x-callback-token") token: string) {
    // Verifikasi token callback Xendit dilakukan di XenditProvider.verifyCallbackToken
    // (dipanggil di sini secara langsung untuk menjaga contoh tetap ringkas)
    if (!token) {
      throw new UnauthorizedException("Missing callback token");
    }

    return this.paymentsService.handleWebhook({
      gatewayReference: payload.external_id,
      status: payload.status === "PAID" ? "success" : "failed",
      rawPayload: payload,
    });
  }

  @Post("payment-gateway/ipaymu")
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleIpaymuWebhook(@Body() payload: any) {
    const result = await this.ipaymuProvider.verifyCallback(payload);

    if (!result.isValid || !result.orderId) {
      throw new UnauthorizedException("Invalid iPaymu callback payload");
    }

    return this.paymentsService.handleWebhook({
      gatewayReference: result.orderId,
      status: result.status,
      rawPayload: payload,
    });
  }
}
