import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client, LocalAuth } from "whatsapp-web.js";
import * as QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";

export type WaConnectionStatus =
  | "disconnected"
  | "initializing"
  | "qr"
  | "authenticated"
  | "ready"
  | "auth_failure";

/**
 * WhatsApp service dengan dua mode provider (dipilih via env WA_PROVIDER):
 *  - "cloud"  : Meta WhatsApp Business Cloud API (resmi)
 *  - "webjs"  : whatsapp-web.js (gateway berbasis WhatsApp Web, scan QR)
 */
@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);

  private client: Client | null = null;
  private status: WaConnectionStatus = "disconnected";
  private lastQr: string | null = null;
  private lastQrDataUrl: string | null = null;
  private clientInfo: any = null;
  private initializing = false;

  constructor(private readonly config: ConfigService) {}

  private get provider(): string {
    return this.config.get<string>("WA_PROVIDER", "cloud");
  }

  private get sessionPath(): string {
    return this.config.get<string>("WA_SESSION_PATH", "./.wwebjs_auth");
  }

  async onModuleInit() {
    if (this.provider === "webjs") {
      // Bersihkan lock yang mungkin tertinggal dari proses sebelumnya.
      this.cleanupLock();
      // Auto-init jika sesi sebelumnya sudah tersimpan (LocalAuth).
      this.initWebJs().catch((e) =>
        this.logger.error(`Gagal inisialisasi WA webjs saat startup: ${e.message}`),
      );
    }
  }

  /**
   * Hapus SingletonLock/SingletonCookie Chromium yang bisa membuat error
   * "browser is already running" kalau proses sebelumnya tidak mati bersih.
   */
  private cleanupLock() {
    try {
      const dir = path.join(this.sessionPath, "session-isp-billing");
      for (const f of ["SingletonLock", "SingletonCookie", "SingletonSocket"]) {
        const p = path.join(dir, f);
        if (fs.existsSync(p)) {
          fs.rmSync(p, { force: true });
          this.logger.log(`Menghapus lock file: ${f}`);
        }
      }
    } catch (e: any) {
      this.logger.warn(`Gagal cleanup lock: ${e.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // whatsapp-web.js session management
  // ---------------------------------------------------------------------------

  async initWebJs(): Promise<void> {
    // Guard: jangan init ulang kalau client sudah ada & hidup, atau sedang init.
    if (this.initializing) {
      this.logger.log("WA sedang initializing, skip init duplikat.");
      return;
    }
    if (this.client && (this.status === "ready" || this.status === "authenticated" || this.status === "qr")) {
      this.logger.log(`WA client sudah aktif (status: ${this.status}), skip init.`);
      return;
    }

    // Kalau ada client lama yang error/disconnected, hancurkan dulu.
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {
        /* ignore */
      }
      this.client = null;
    }

    this.cleanupLock();

    this.initializing = true;
    this.status = "initializing";
    this.lastQr = null;
    this.lastQrDataUrl = null;

    let executablePath = this.config.get<string>("WA_CHROME_PATH") || undefined;
    if (executablePath && !fs.existsSync(executablePath)) {
      this.logger.warn(`WA_CHROME_PATH tidak ditemukan: ${executablePath}, memakai bundled Chromium.`);
      executablePath = undefined;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "isp-billing",
        dataPath: this.sessionPath,
      }),
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-extensions",
        ],
      },
    });

    this.client.on("qr", async (qr) => {
      this.lastQr = qr;
      this.status = "qr";
      try {
        this.lastQrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
      } catch {
        this.lastQrDataUrl = null;
      }
      this.logger.log("WA QR code diterima. Scan via admin panel.");
    });

    this.client.on("loading_screen", (percent) => {
      this.logger.log(`WA loading: ${percent}%`);
    });

    this.client.on("authenticated", () => {
      this.status = "authenticated";
      this.lastQr = null;
      this.lastQrDataUrl = null;
      this.logger.log("WA authenticated.");
    });

    this.client.on("auth_failure", (msg) => {
      this.status = "auth_failure";
      this.logger.error(`WA auth failure: ${msg}`);
    });

    this.client.on("ready", () => {
      this.status = "ready";
      this.lastQr = null;
      this.lastQrDataUrl = null;
      this.clientInfo = this.client?.info ?? null;
      this.logger.log("WA client READY. Gateway siap mengirim pesan.");
    });

    this.client.on("disconnected", async (reason) => {
      this.status = "disconnected";
      this.logger.warn(`WA disconnected: ${reason}`);
      try {
        await this.client?.destroy();
      } catch {
        /* ignore */
      }
      this.client = null;
      this.cleanupLock();
    });

    try {
      await this.client.initialize();
    } catch (e: any) {
      this.logger.error(`WA initialize error: ${e.message}`);
      this.status = "disconnected";
      try {
        await this.client?.destroy();
      } catch {
        /* ignore */
      }
      this.client = null;
      this.cleanupLock();
      throw e;
    } finally {
      this.initializing = false;
    }
  }

  async logout(): Promise<void> {
    if (this.client) {
      try {
        await this.client.logout();
      } catch (e: any) {
        this.logger.warn(`Logout error: ${e.message}`);
      }
      try {
        await this.client.destroy();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
    this.status = "disconnected";
    this.lastQr = null;
    this.lastQrDataUrl = null;
    this.clientInfo = null;
    this.initializing = false;
    this.cleanupLock();
  }

  getStatus() {
    return {
      provider: this.provider,
      status: this.status,
      qr: this.lastQr,
      qrImage: this.lastQrDataUrl,
      info: this.clientInfo
        ? { pushname: this.clientInfo.pushname, wid: this.clientInfo.wid?._serialized }
        : null,
    };
  }

  // ---------------------------------------------------------------------------
  // Send message (routes ke provider aktif)
  // ---------------------------------------------------------------------------

  private normalizePhone(phone: string): string {
    let p = phone.replace(/[^0-9]/g, "");
    if (p.startsWith("0")) p = "62" + p.slice(1);
    if (p.startsWith("620")) p = "62" + p.slice(3);
    return p;
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    if (this.provider === "webjs") {
      return this.sendViaWebJs(phone, message);
    }
    return this.sendViaCloudApi(phone, message);
  }

  private async sendViaWebJs(phone: string, message: string): Promise<void> {
    if (!this.client || this.status !== "ready") {
      throw new Error(
        `WhatsApp gateway belum siap (status: ${this.status}). Scan QR di admin panel terlebih dahulu.`,
      );
    }
    const number = this.normalizePhone(phone);
    // Verifikasi nomor terdaftar di WhatsApp
    const numberId = await this.client.getNumberId(number);
    if (!numberId) {
      throw new Error(`Nomor ${phone} tidak terdaftar di WhatsApp.`);
    }
    await this.client.sendMessage(numberId._serialized, message);
    this.logger.log(`Pesan WA (webjs) terkirim ke ${phone}`);
  }

  private async sendViaCloudApi(phone: string, message: string): Promise<void> {
    const baseUrl = this.config.get<string>("WA_API_BASE_URL");
    const phoneNumberId = this.config.get<string>("WA_PHONE_NUMBER_ID");
    const accessToken = this.config.get<string>("WA_ACCESS_TOKEN");

    const response = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: this.normalizePhone(phone),
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gagal mengirim WhatsApp ke ${phone}: ${errorText}`);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }
  }
}
