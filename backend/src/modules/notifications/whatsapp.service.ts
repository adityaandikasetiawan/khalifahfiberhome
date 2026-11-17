import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import * as QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { WaMessage } from "./entities/wa-message.entity";

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

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(WaMessage) private readonly waMessageRepo: Repository<WaMessage>,
  ) {}

  /** Normalisasi chatId WA (62xxx@c.us) -> nomor 62xxx. */
  private chatIdToPhone(id: string): string {
    return (id || "").replace(/@c\.us$/, "").replace(/@g\.us$/, "").replace(/[^0-9]/g, "");
  }

  /** Simpan 1 pesan WA (masuk/keluar) ke histori. Dedup via waMessageId. */
  async saveMessage(data: {
    phone: string;
    direction: "in" | "out";
    type?: "text" | "image" | "document" | "other";
    body?: string;
    mediaUrl?: string;
    senderName?: string;
    waMessageId?: string;
  }): Promise<void> {
    try {
      if (data.waMessageId) {
        const dup = await this.waMessageRepo.findOne({ where: { waMessageId: data.waMessageId } });
        if (dup) return;
      }
      await this.waMessageRepo.save(
        this.waMessageRepo.create({
          phone: this.chatIdToPhone(data.phone),
          direction: data.direction,
          type: data.type ?? "text",
          body: data.body,
          mediaUrl: data.mediaUrl,
          senderName: data.senderName,
          waMessageId: data.waMessageId,
          isRead: data.direction === "out",
        }),
      );
    } catch (err) {
      this.logger.error(`Gagal simpan histori WA: ${(err as Error).message}`);
    }
  }

  /** Folder penyimpanan media WA masuk (di-serve backend di /uploads/wa). */
  private get waMediaDir(): string {
    return path.join(process.cwd(), "public", "uploads", "wa");
  }

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
        // Naikkan timeout protokol CDP. Default membuat "Runtime.callFunctionOn
        // timed out" saat Chromium lambat merespons (server RAM terbatas),
        // menyebabkan pengiriman WA gagal. 120 detik memberi ruang lebih.
        protocolTimeout: 120000,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-extensions",
          // Hemat memori Chromium di server dengan RAM terbatas (mengurangi
          // kemungkinan tab hang/crash yang memicu timeout).
          "--disable-background-networking",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--js-flags=--max-old-space-size=256",
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

    // Pesan MASUK dari pelanggan -> simpan ke histori (+ download media jika ada).
    this.client.on("message", async (msg: any) => {
      try {
        // Abaikan pesan grup & status broadcast.
        if (msg.from?.endsWith("@g.us") || msg.from === "status@broadcast") return;

        // Ambil NOMOR ASLI dari kontak. msg.from pada WhatsApp Web terbaru bisa
        // berupa LID (xxxx@lid) -- ID internal, BUKAN nomor telepon, dan
        // contact.number pun ikut berisi LID untuk kontak seperti ini. Nomor
        // telepon sebenarnya tersimpan di contact.id (WID @c.us), mis.
        // contact.id.user=6282226011179 / contact.id._serialized=62...@c.us.
        let contact: any = null;
        try {
          contact = await msg.getContact();
        } catch {
          /* ignore */
        }

        // Urutan sumber nomor asli (abaikan yang berakhiran @lid):
        // 1) msg.from jika @c.us          -> format normal, nomor asli
        // 2) contact.id (WID @c.us)       -> nomor asli walau from berupa @lid
        // 3) msg.author jika @c.us        -> kasus tertentu
        // 4) contact.number              -> hanya jika BUKAN sama dengan LID from
        const fromCus = msg.from?.endsWith("@c.us") ? msg.from.replace("@c.us", "") : null;
        const authorCus = msg.author?.endsWith("@c.us") ? msg.author.replace("@c.us", "") : null;

        // WID dari contact.id -- hanya dipakai bila bertipe "c.us" (nomor telepon),
        // bukan "lid". contact.id.user = nomor murni; _serialized = 62xxx@c.us.
        const contactIdServer = contact?.id?.server; // "c.us" | "lid" | "g.us"
        const contactWid =
          contactIdServer === "c.us" && contact?.id?.user
            ? String(contact.id.user).replace(/[^0-9]/g, "")
            : null;

        // from berupa LID -> jangan percaya contact.number (ikut tercemar LID).
        const fromIsLid = msg.from?.endsWith("@lid");
        const contactNum =
          !fromIsLid && contact?.number ? String(contact.number).replace(/[^0-9]/g, "") : null;

        const phone = fromCus || contactWid || authorCus || contactNum || undefined;

        // Validasi nomor Indonesia: 62 diikuti 8-12 digit (total 10-14).
        // ID LID biasanya ~15 digit tanpa pola 62 -> ditolak.
        const digits = (phone || "").replace(/[^0-9]/g, "");
        const isValidPhone = /^62\d{8,12}$/.test(digits) || /^0\d{8,12}$/.test(digits);
        if (!isValidPhone) {
          this.logger.warn(
            `Pesan WA masuk dilewati: nomor tidak valid ` +
              `(from=${msg.from}, contact.id=${contact?.id?._serialized}, resolved=${digits})`,
          );
          return;
        }

        let type: "text" | "image" | "document" | "other" = "text";
        let mediaUrl: string | undefined;

        if (msg.hasMedia) {
          try {
            const media = await msg.downloadMedia();
            if (media?.data) {
              const mime = media.mimetype || "application/octet-stream";
              const ext = mime.includes("jpeg") ? "jpg"
                : mime.includes("png") ? "png"
                : mime.includes("webp") ? "webp"
                : mime.includes("pdf") ? "pdf"
                : (mime.split("/")[1] || "bin").split(";")[0];
              type = mime.startsWith("image/") ? "image" : mime.includes("pdf") || !mime.startsWith("image/") ? "document" : "other";
              fs.mkdirSync(this.waMediaDir, { recursive: true });
              const fname = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
              fs.writeFileSync(path.join(this.waMediaDir, fname), Buffer.from(media.data, "base64"));
              mediaUrl = `/uploads/wa/${fname}`;
            }
          } catch (e) {
            this.logger.warn(`Gagal download media WA masuk: ${(e as Error).message}`);
          }
        }

        await this.saveMessage({
          // Normalisasi ke format 62xxx agar pesan masuk & keluar mengelompok
          // di chat yang sama (sendMessage juga memakai normalizePhone).
          phone: this.normalizePhone(digits),
          direction: "in",
          type,
          body: msg.body || undefined,
          mediaUrl,
          senderName: msg._data?.notifyName || msg.notifyName || undefined,
          waMessageId: msg.id?._serialized,
        });
      } catch (err) {
        this.logger.error(`Gagal proses pesan WA masuk: ${(err as Error).message}`);
      }
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

  async sendMessage(phone: string, message: string, imageUrl?: string): Promise<void> {
    if (this.provider === "webjs") {
      return this.sendViaWebJs(phone, message, imageUrl);
    }
    return this.sendViaCloudApi(phone, message);
  }

  /**
   * Resolve imageUrl menjadi MessageMedia.
   * - URL /uploads/... atau path relatif -> baca file lokal dari backend/public
   * - URL http(s) -> ambil via MessageMedia.fromUrl
   * Mengembalikan null bila gagal (biar pengiriman fallback ke teks saja).
   */
  private async resolveMedia(imageUrl: string): Promise<MessageMedia | null> {
    try {
      // Ambil buffer gambar (dari file lokal publik atau URL http).
      let buf: Buffer;
      if (/^https?:\/\//i.test(imageUrl)) {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`fetch gambar gagal: ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
      } else {
        const rel = imageUrl.replace(/^\//, "");
        const fullPath = path.join(process.cwd(), "public", rel);
        if (!fs.existsSync(fullPath)) {
          this.logger.warn(`File gambar broadcast tidak ditemukan: ${fullPath}`);
          return null;
        }
        buf = await fs.promises.readFile(fullPath);
      }

      // Konversi ke JPEG untuk kompatibilitas maksimal di WhatsApp.
      // (WebP kadang memicu error serialisasi/sticker di whatsapp-web.js.)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require("sharp");
      const jpeg = await sharp(buf).jpeg({ quality: 85 }).toBuffer();
      return new MessageMedia("image/jpeg", jpeg.toString("base64"), "gambar.jpg");
    } catch (err) {
      this.logger.error(`Gagal memuat gambar WA (${imageUrl})`, err as Error);
      return null;
    }
  }

  private async sendViaWebJs(phone: string, message: string, imageUrl?: string): Promise<void> {
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

    if (imageUrl) {
      const media = await this.resolveMedia(imageUrl);
      if (media) {
        try {
          // Kirim gambar dengan caption = pesan (teks + gambar dalam 1 pesan).
          await this.client.sendMessage(numberId._serialized, media, { caption: message });
          this.logger.log(`Pesan WA + gambar (webjs) terkirim ke ${phone}`);
          await this.saveMessage({ phone, direction: "out", type: "image", body: message, mediaUrl: imageUrl });
          return;
        } catch (err) {
          // Fallback: beberapa versi WhatsApp Web/library gagal kirim media
          // (error "id property"). Kirim teks + link gambar agar pesan tetap sampai.
          this.logger.warn(
            `Kirim media WA gagal (${(err as Error).message}); fallback ke teks + link untuk ${phone}`,
          );
          const base = (process.env.PUBLIC_MEDIA_BASE_URL || process.env.PORTAL_BASE_URL || "").replace(/\/(portal)?\/?$/, "");
          const link = /^https?:\/\//i.test(imageUrl) ? imageUrl : `${base}${imageUrl}`;
          const textWithLink = `${message}\n\n🖼️ Gambar: ${link}`;
          await this.client.sendMessage(numberId._serialized, textWithLink);
          this.logger.log(`Pesan WA (teks + link gambar) terkirim ke ${phone}`);
          await this.saveMessage({ phone, direction: "out", type: "image", body: textWithLink, mediaUrl: imageUrl });
          return;
        }
      }
      // gambar gagal dimuat -> fallback kirim teks saja
    }
    await this.client.sendMessage(numberId._serialized, message);
    this.logger.log(`Pesan WA (webjs) terkirim ke ${phone}`);
    await this.saveMessage({ phone, direction: "out", type: "text", body: message });
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
