import { Injectable, Logger, BadRequestException, NotFoundException, HttpException, HttpStatus, OnModuleDestroy, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import Redis from "ioredis";
import { CustomersService } from "../customers/customers.service";
import { Customer } from "../customers/entities/customer.entity";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { WhatsAppService } from "../notifications/whatsapp.service";
import { EmailService } from "../notifications/email.service";
import { renderBrandedEmail, BrandInfo } from "../notifications/email-template";

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
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SiteSetting) private readonly settingRepo: Repository<SiteSetting>,
    private readonly emailService: EmailService,
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

  // Normalisasi nomor ke format kanonik 62xxx agar key Redis & lookup konsisten
  // apapun format input (08xxx / +62xxx / 62xxx).
  private normalizePhone(phone: string): string {
    let p = phone.replace(/[^0-9]/g, "");
    if (p.startsWith("0")) p = "62" + p.slice(1);
    return p;
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
  async requestOtp(phoneInput: string): Promise<{ message: string }> {
    const phone = this.normalizePhone(phoneInput);
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

  async verifyOtp(phoneInput: string, otp: string): Promise<{ accessToken: string; customer: any }> {
    const phone = this.normalizePhone(phoneInput);
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

  private signCustomerToken(customer: { id: string; phone: string }) {
    return this.jwtService.sign(
      { sub: customer.id, phone: customer.phone, type: "customer" },
      { expiresIn: "7d" },
    );
  }

  private async getBrand(): Promise<BrandInfo> {
    let company: any = {};
    try {
      const s = await this.settingRepo.findOne({ where: { key: "company" } });
      company = s?.value ?? {};
    } catch {
      /* fallback */
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

  /**
   * LOGIN portal via EMAIL + PASSWORD. Alternatif dari OTP WhatsApp.
   * Syarat: email cocok, password cocok, dan email sudah terverifikasi.
   */
  async loginWithPassword(email: string, passwordRaw: string) {
    const emailNorm = (email || "").trim().toLowerCase();
    // Trim spasi tak sengaja (autofill/paste sering menambah trailing space).
    const password = (passwordRaw ?? "").trim();
    // Ambil password + emailVerifiedAt yang bertanda select:false
    const customer = await this.customerRepo
      .createQueryBuilder("c")
      .addSelect("c.password")
      .where("LOWER(c.email) = :email", { email: emailNorm })
      .getOne();

    // Pesan generik untuk hindari enumerasi akun.
    const generic = new UnauthorizedException("Email atau password salah");
    if (!customer || !customer.password) throw generic;

    const ok = await bcrypt.compare(password, customer.password);
    if (!ok) throw generic;

    if (!customer.emailVerifiedAt) {
      throw new BadRequestException("Email belum diverifikasi. Silakan cek email verifikasi Anda.");
    }

    return {
      accessToken: this.signCustomerToken(customer),
      customer: { id: customer.id, name: customer.name, customerNumber: customer.customerNumber },
    };
  }

  /**
   * Set password pertama kali / ganti password lewat token reset.
   * Token dibuat oleh requestPasswordReset (dikirim via email) atau saat
   * registrasi (pelanggan baru mengisi password langsung -> tidak lewat sini).
   */
  async setPasswordWithToken(token: string, newPasswordRaw: string) {
    const newPassword = (newPasswordRaw ?? "").trim();
    if (!token || !newPassword || newPassword.length < 6) {
      throw new BadRequestException("Token tidak valid atau password minimal 6 karakter");
    }
    const customer = await this.customerRepo
      .createQueryBuilder("c")
      .addSelect("c.passwordResetToken")
      .addSelect("c.passwordResetExpires")
      .where("c.passwordResetToken = :token", { token })
      .getOne();

    if (!customer) throw new BadRequestException("Token reset tidak ditemukan atau sudah digunakan");
    if (customer.passwordResetExpires && new Date(customer.passwordResetExpires) < new Date()) {
      throw new BadRequestException("Token reset sudah kedaluwarsa. Minta tautan baru.");
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await this.customerRepo
      .createQueryBuilder()
      .update(Customer)
      .set({
        password: hash,
        passwordSetAt: new Date(),
        passwordResetToken: null as any,
        passwordResetExpires: null as any,
        // token set-password sekaligus memverifikasi kepemilikan email
        emailVerifiedAt: customer.emailVerifiedAt ?? new Date(),
      })
      .where("id = :id", { id: customer.id })
      .execute();

    return { message: "Password berhasil disimpan. Silakan login dengan email & password Anda." };
  }

  /**
   * Minta tautan reset/atur password dikirim ke email pelanggan.
   * Respons generik (tidak bocorkan apakah email terdaftar).
   */
  async requestPasswordReset(email: string) {
    const emailNorm = (email || "").trim().toLowerCase();
    const generic = { message: "Jika email terdaftar, tautan atur password telah dikirim." };
    if (!emailNorm) return generic;

    const customer = await this.customerRepo
      .createQueryBuilder("c")
      .where("LOWER(c.email) = :email", { email: emailNorm })
      .getOne();
    if (!customer || !customer.email) return generic;

    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
    await this.customerRepo
      .createQueryBuilder()
      .update(Customer)
      .set({ passwordResetToken: token, passwordResetExpires: expires })
      .where("id = :id", { id: customer.id })
      .execute();

    await this.sendResetEmail(customer.email, customer.name, customer.customerNumber, token);
    return generic;
  }

  private async sendResetEmail(email: string, name: string, customerNumber: string, token: string) {
    const base = this.config.get("PORTAL_BASE_URL", "https://khalifahfiberhome.my.id/portal");
    const url = `${base}/atur-password?token=${token}`;
    const brand = await this.getBrand();
    const html = renderBrandedEmail(brand, {
      greetingName: name,
      heading: "Atur Password",
      accent: "#2563eb",
      emoji: "🔒",
      intro:
        "Silakan atur/reset password akun portal Anda dengan menekan tombol di bawah ini. Tautan berlaku 1 jam.",
      rows: [{ label: "Username (No. Pelanggan)", value: customerNumber, strong: true }],
      buttonText: "Atur Password",
      buttonUrl: url,
      note: `Jika tombol tidak berfungsi, buka: ${url}. Abaikan email ini jika Anda tidak meminta.`,
    });
    try {
      await this.emailService.sendEmail({
        to: email,
        toName: name,
        subject: `Atur password portal - ${brand.name}`,
        htmlContent: html,
      });
    } catch (err) {
      this.logger.error(`Gagal kirim email reset password ke ${email}`, err as Error);
    }
  }
}
