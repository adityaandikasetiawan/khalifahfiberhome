import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Guard IP whitelist untuk endpoint webhook payment gateway.
 *
 * SENGAJA tidak di-hardcode ke IP range Midtrans/Xendit tertentu -- daftar IP
 * resmi mereka bisa berubah sewaktu-waktu, dan meng-hardcode IP yang salah
 * atau kedaluwarsa justru berbahaya (webhook asli bisa ter-block tanpa
 * disadari). Sebagai gantinya, daftar IP diambil dari env var
 * WEBHOOK_ALLOWED_IPS (comma-separated) yang harus diisi admin dengan IP
 * resmi dari dokumentasi payment gateway yang dipakai saat itu.
 *
 * Kalau WEBHOOK_ALLOWED_IPS tidak diisi, guard ini TIDAK memblokir apa pun
 * (fail-open) -- supaya default behaviour tetap sama seperti sebelum guard
 * ini ada, dan admin secara sadar mengaktifkan proteksi ini saat siap.
 * Keamanan utama endpoint webhook tetap berada di verifikasi signature,
 * bukan di guard ini -- guard ini murni lapisan tambahan (defense in depth).
 */
@Injectable()
export class WebhookIpWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(WebhookIpWhitelistGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedIpsRaw = this.config.get<string>("WEBHOOK_ALLOWED_IPS", "");
    const allowedIps = allowedIpsRaw
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    if (allowedIps.length === 0) {
      return true; // fail-open: proteksi ini belum diaktifkan
    }

    const request = context.switchToHttp().getRequest();
    const clientIp = this.extractClientIp(request);

    if (!allowedIps.includes(clientIp)) {
      this.logger.warn(`Webhook ditolak dari IP tidak dikenal: ${clientIp}`);
      throw new ForbiddenException("IP tidak diizinkan mengakses endpoint ini");
    }

    return true;
  }

  private extractClientIp(request: any): string {
    // Kalau di belakang reverse proxy (Nginx), pastikan trust proxy diaktifkan
    // di main.ts (app.set('trust proxy', 1)) supaya req.ip akurat, bukan IP Nginx.
    const forwarded = request.headers["x-forwarded-for"];
    if (forwarded) {
      return String(forwarded).split(",")[0].trim();
    }
    return request.ip ?? request.socket?.remoteAddress ?? "";
  }
}
