import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";

/**
 * Credential_Vault — enkripsi/dekripsi kredensial API router (AES-256-GCM).
 *
 * Kunci diambil dari environment MIKROTIK_CRED_KEY (32 byte).
 * Diterima dalam bentuk:
 *   - hex 64 karakter, atau
 *   - base64 yang men-decode ke 32 byte, atau
 *   - string bebas (akan di-hash SHA-256 menjadi 32 byte).
 *
 * Format ciphertext tersimpan: "v1:<iv_b64>:<tag_b64>:<ciphertext_b64>".
 * Prefix "v1:" dipakai untuk mendeteksi apakah sebuah nilai sudah terenkripsi
 * (isEncrypted), sehingga kredensial plaintext lama tetap kompatibel.
 */
@Injectable()
export class CredentialVaultService {
  private readonly logger = new Logger(CredentialVaultService.name);
  private static readonly PREFIX = "v1:";
  private readonly key: Buffer | null;

  constructor() {
    this.key = this.loadKey();
    if (!this.key) {
      this.logger.warn(
        "MIKROTIK_CRED_KEY tidak diset — enkripsi kredensial router NONAKTIF. Set env ini untuk mengamankan password API.",
      );
    }
  }

  private loadKey(): Buffer | null {
    const raw = process.env.MIKROTIK_CRED_KEY;
    if (!raw || raw.trim() === "") return null;
    const val = raw.trim();

    // hex 64 char -> 32 byte
    if (/^[0-9a-fA-F]{64}$/.test(val)) {
      return Buffer.from(val, "hex");
    }
    // base64 -> 32 byte
    try {
      const b = Buffer.from(val, "base64");
      if (b.length === 32) return b;
    } catch {
      /* ignore */
    }
    // fallback: hash apa pun jadi 32 byte
    return crypto.createHash("sha256").update(val).digest();
  }

  /** Apakah kunci enkripsi tersedia? */
  isConfigured(): boolean {
    return this.key !== null;
  }

  /** Apakah sebuah nilai sudah dalam bentuk terenkripsi (punya prefix v1:)? */
  isEncrypted(value: string | undefined | null): boolean {
    return typeof value === "string" && value.startsWith(CredentialVaultService.PREFIX);
  }

  /**
   * Enkripsi plaintext -> "v1:iv:tag:ciphertext" (base64).
   * Jika kunci tidak tersedia, kembalikan plaintext apa adanya (mode nonaktif).
   * Jika sudah terenkripsi, kembalikan apa adanya (idempoten).
   */
  encrypt(plaintext: string): string {
    if (!this.key) return plaintext;
    if (this.isEncrypted(plaintext)) return plaintext;

    const iv = crypto.randomBytes(12); // 96-bit IV untuk GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return (
      CredentialVaultService.PREFIX +
      `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
    );
  }

  /**
   * Dekripsi "v1:iv:tag:ciphertext" -> plaintext.
   * Jika nilai bukan bentuk terenkripsi (kredensial plaintext lama), kembalikan
   * apa adanya agar tetap kompatibel.
   */
  decrypt(value: string): string {
    if (!this.isEncrypted(value)) return value; // plaintext lama / mode nonaktif
    if (!this.key) {
      throw new Error("MIKROTIK_CRED_KEY tidak tersedia untuk mendekripsi kredensial router");
    }
    const body = value.slice(CredentialVaultService.PREFIX.length);
    const [ivB64, tagB64, dataB64] = body.split(":");
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error("Format kredensial terenkripsi tidak valid");
    }
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  }

  /** Ganti nilai kredensial dengan penanda tersamar untuk respons/log. */
  mask(_value?: string | null): string {
    return "********";
  }
}
