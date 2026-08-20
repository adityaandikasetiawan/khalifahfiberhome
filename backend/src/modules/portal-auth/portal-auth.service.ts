import { Injectable, Logger, BadRequestException, NotFoundException, HttpException, HttpStatus, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import Redis from "ioredis";
import { CustomersService } from "../customers/customers.service";
import { WhatsAppService } from "../notifications/whatsapp.service";

const OTP_TTL_SECONDS = 5 * 60; // 5 menit
const OTP_RESEND_COOLDOWN_SECONDS = 60; // minimal jeda 1 menit antar kirim ulang
const OTP_MAX_ATTEMPTS = 5; // maksimal 5 kali salah input sebelum OTP dianggap hangus

@Injectable()
export class PortalAuthService implements OnModuleDestroy {
  private readonly logger = new Logger(PortalAuthService.name);
  private readonly redis: Redis;

  constructor(
    private readonly config: ConfigService,
    private readonly customersService: CustomersService,
    private readonly whatsAppService: WhatsAppService,
    private readonly jwtService: JwtService,
  ) {
    this.redis = new Redis({
      host: this.config.get("REDIS_HOST", "localhost"),
      port: parseInt(this.config.get("REDIS_PORT", "6379"), 10),
    });
  }

  // Menutup koneksi Redis dengan bersih saat aplikasi shutdown (mis. saat test
  // di CI selesai atau saat proses PM2 di-restart) -- tanpa ini, koneksi
  // menggantung dan test runner harus dipaksa keluar dengan --forceExit.
  async onModuleDestroy() {
    await this.redis.quit();
  }

  private otpKey(phone: string) {
    return `portal-otp:${phone}`;
  }
  private cooldownKey(phone: string) {
    return `portal-otp-cooldown:${phone}`;
  }
  private attemptsKey(phone: string) {
    return `portal-otp-attempts:${phone}`;
  }

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Kirim OTP ke nomor pelanggan terdaftar. Selalu mengembalikan respons
   * generik yang sama baik nomor terdaftar maupun tidak, agar endpoint ini
   * tidak bisa dipakai untuk enumerasi nomor pelanggan yang valid.
   */
  async requestOtp(phone: string): Promise<{ message: string }> {
    const onCooldown = await this.redis.get(this.cooldownKey(phone));
    if (onCooldown) {
      throw new HttpException("Mohon tunggu sebelum meminta kode OTP baru", HttpStatus.TOO_MANY_REQUESTS);
    }

    const customer = await this.customersService.findByPhone(phone);

    // Tetap set cooldown & kembalikan pesan sukses walau nomor tidak ditemukan,
    // supaya endpoint ini tidak bocor informasi nomor mana yang terdaftar.
    await this.redis.set(this.cooldownKey(phone), "1", "EX", OTP_RESEND_COOLDOWN_SECONDS);

    if (!customer) {
      this.logger.warn(`Percobaan OTP untuk nomor tidak terdaftar: ${phone}`);
      return { message: "Jika nomor terdaftar, kode OTP akan dikirim via WhatsApp." };
    }

    const otp = this.generateOtp();
    await this.redis.set(this.otpKey(phone), otp, "EX", OTP_TTL_SECONDS);
    await this.redis.del(this.attemptsKey(phone));

    try {
      await this.whatsAppService.sendMessage(
        phone,
        `Kode OTP login Anda: ${otp}. Berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`,
      );
    } catch (err) {
      // Tidak melempar error ke client -- gagal kirim WA tidak boleh membocorkan
      // status "nomor terdaftar" lewat perbedaan response. Dicatat di log saja.
      this.logger.error(`Gagal mengirim OTP WhatsApp ke ${phone}`, err as Error);
    }

    return { message: "Jika nomor terdaftar, kode OTP akan dikirim via WhatsApp." };
  }

  async verifyOtp(phone: string, otp: string): Promise<{ accessToken: string; customer: any }> {
    const attempts = parseInt((await this.redis.get(this.attemptsKey(phone))) ?? "0", 10);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await this.redis.del(this.otpKey(phone));
      throw new BadRequestException("Terlalu banyak percobaan salah. Minta kode OTP baru.");
    }

    const storedOtp = await this.redis.get(this.otpKey(phone));
    if (!storedOtp) {
      throw new BadRequestException("Kode OTP tidak valid atau sudah kedaluwarsa");
    }

    if (storedOtp !== otp) {
      await this.redis.incr(this.attemptsKey(phone));
      await this.redis.expire(this.attemptsKey(phone), OTP_TTL_SECONDS);
      throw new BadRequestException("Kode OTP salah");
    }

    const customer = await this.customersService.findByPhone(phone);
    if (!customer) {
      // Kondisi ini seharusnya tidak pernah terjadi (OTP hanya dibuat untuk
      // nomor terdaftar), tapi dijaga untuk keamanan.
      throw new NotFoundException("Pelanggan tidak ditemukan");
    }

    await this.redis.del(this.otpKey(phone));
    await this.redis.del(this.attemptsKey(phone));

    const accessToken = this.jwtService.sign(
      { sub: customer.id, phone: customer.phone, type: "customer" },
      { expiresIn: "7d" }, // sesi portal pelanggan lebih panjang dari admin (7 hari vs 15 menit)
    );

    return {
      accessToken,
      customer: { id: customer.id, name: customer.name, customerNumber: customer.customerNumber },
    };
  }
}
