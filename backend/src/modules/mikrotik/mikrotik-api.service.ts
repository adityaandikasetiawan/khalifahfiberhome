import { Injectable, Logger } from "@nestjs/common";
import { RouterOSClient } from "routeros-client";
import { Router } from "./entities/router.entity";
import { CredentialVaultService } from "./credential-vault.service";

/**
 * Abstraksi komunikasi ke RouterOS API.
 * Setiap method menerima entity Router sebagai parameter agar bisa
 * mendukung multi-router (panggil ke router mana saja sesuai subscription).
 */
@Injectable()
export class MikrotikApiService {
  private readonly logger = new Logger(MikrotikApiService.name);

  constructor(private readonly vault: CredentialVaultService) {}

  private createClient(router: Router): RouterOSClient {
    // Dekripsi password hanya di memori proses saat membuat koneksi.
    // Kredensial plaintext lama tetap kompatibel (decrypt mengembalikan apa adanya).
    const password = this.vault.decrypt(router.password);
    return new RouterOSClient({
      host: router.host,
      port: router.port,
      user: router.username,
      password,
      tls: router.useTls ? {} : undefined,
      timeout: 10000,
    });
  }

  /**
   * Test koneksi ke router. Return true jika berhasil.
   */
  async testConnection(router: Router): Promise<{ success: boolean; identity?: string; error?: string }> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const [identity] = await api.menu("/system/identity").getAll();
      await client.close();
      return { success: true, identity: identity.name };
    } catch (err: any) {
      this.logger.error(`Gagal koneksi ke router ${router.name} (${router.host}): ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Disable PPPoE secret (isolir pelanggan).
   * Mencari secret berdasarkan username (field "name" di PPPoE secret).
   */
  async disablePppoeSecret(router: Router, pppoeUsername: string): Promise<boolean> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const secrets = await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .getAll();

      if (secrets.length === 0) {
        this.logger.warn(`PPPoE secret "${pppoeUsername}" tidak ditemukan di router ${router.name}`);
        await client.close();
        return false;
      }

      await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .update({ disabled: "yes" });

      // Kick active connection jika sedang online
      const active = await api.menu("/ppp/active")
        .where("name", pppoeUsername)
        .getAll();
      if (active.length > 0) {
        await api.menu("/ppp/active")
          .where("name", pppoeUsername)
          .remove();
      }

      await client.close();
      this.logger.log(`PPPoE secret "${pppoeUsername}" DISABLED di router ${router.name}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Gagal disable PPPoE ${pppoeUsername} di ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return false;
    }
  }

  /**
   * Enable PPPoE secret (aktivasi pelanggan setelah bayar).
   */
  async enablePppoeSecret(router: Router, pppoeUsername: string): Promise<boolean> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const secrets = await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .getAll();

      if (secrets.length === 0) {
        this.logger.warn(`PPPoE secret "${pppoeUsername}" tidak ditemukan di router ${router.name}`);
        await client.close();
        return false;
      }

      await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .update({ disabled: "no" });

      await client.close();
      this.logger.log(`PPPoE secret "${pppoeUsername}" ENABLED di router ${router.name}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Gagal enable PPPoE ${pppoeUsername} di ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return false;
    }
  }

  /**
   * Update profile/speed PPPoE secret (ganti paket).
   */
  async updatePppoeProfile(router: Router, pppoeUsername: string, profileName: string): Promise<boolean> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const secrets = await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .getAll();

      if (secrets.length === 0) {
        this.logger.warn(`PPPoE secret "${pppoeUsername}" tidak ditemukan di router ${router.name}`);
        await client.close();
        return false;
      }

      await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .update({ profile: profileName });

      // Kick active connection agar reconnect dengan profile baru
      const active = await api.menu("/ppp/active")
        .where("name", pppoeUsername)
        .getAll();
      if (active.length > 0) {
        await api.menu("/ppp/active")
          .where("name", pppoeUsername)
          .remove();
      }

      await client.close();
      this.logger.log(`PPPoE secret "${pppoeUsername}" profile diubah ke "${profileName}" di router ${router.name}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Gagal update profile PPPoE ${pppoeUsername} di ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return false;
    }
  }

  /**
   * Buat PPPoE secret baru (saat aktivasi subscription baru).
   */
  async createPppoeSecret(
    router: Router,
    pppoeUsername: string,
    pppoePassword: string,
    profileName: string,
  ): Promise<boolean> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();

      // Cek apakah sudah ada
      const existing = await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .getAll();
      if (existing.length > 0) {
        this.logger.warn(`PPPoE secret "${pppoeUsername}" sudah ada di router ${router.name}, skip create`);
        await client.close();
        return true;
      }

      await api.menu("/ppp/secret").add({
        name: pppoeUsername,
        password: pppoePassword,
        service: "pppoe",
        profile: profileName,
      });

      await client.close();
      this.logger.log(`PPPoE secret "${pppoeUsername}" DIBUAT di router ${router.name} dengan profile "${profileName}"`);
      return true;
    } catch (err: any) {
      this.logger.error(`Gagal create PPPoE ${pppoeUsername} di ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return false;
    }
  }

  /**
   * Hapus PPPoE secret (saat subscription di-cancel/terminated).
   */
  async removePppoeSecret(router: Router, pppoeUsername: string): Promise<boolean> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();

      // Kick dulu kalau masih aktif
      const active = await api.menu("/ppp/active")
        .where("name", pppoeUsername)
        .getAll();
      if (active.length > 0) {
        await api.menu("/ppp/active")
          .where("name", pppoeUsername)
          .remove();
      }

      await api.menu("/ppp/secret")
        .where("name", pppoeUsername)
        .remove();

      await client.close();
      this.logger.log(`PPPoE secret "${pppoeUsername}" DIHAPUS dari router ${router.name}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Gagal hapus PPPoE ${pppoeUsername} di ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return false;
    }
  }

  /**
   * Buat profile PPPoE baru di router. Idempoten: kalau nama sudah ada, dianggap sukses.
   */
  async createPppoeProfile(
    router: Router,
    name: string,
    rateLimit?: string,
    localAddress?: string,
    remoteAddress?: string,
  ): Promise<boolean> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const existing = await api.menu("/ppp/profile").where("name", name).getAll();
      if (existing.length > 0) {
        await client.close();
        this.logger.warn(`Profile "${name}" sudah ada di router ${router.name}, skip create`);
        return true;
      }
      const params: any = { name };
      if (rateLimit) params["rate-limit"] = rateLimit;
      if (localAddress) params["local-address"] = localAddress;
      if (remoteAddress) params["remote-address"] = remoteAddress;
      await api.menu("/ppp/profile").add(params);
      await client.close();
      this.logger.log(`Profile "${name}" DIBUAT di router ${router.name} (rate-limit=${rateLimit ?? "-"})`);
      return true;
    } catch (err: any) {
      this.logger.error(`Gagal buat profile ${name} di ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return false;
    }
  }

  /**
   * Ambil daftar PPPoE profiles yang tersedia di router.
   */
  async getPppoeProfiles(router: Router): Promise<{ name: string; localAddress?: string; remoteAddress?: string; rateLimit?: string }[]> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const profiles = await api.menu("/ppp/profile").getAll();
      await client.close();
      return profiles.map((p: any) => ({
        name: p.name,
        localAddress: p["local-address"],
        remoteAddress: p["remote-address"],
        rateLimit: p["rate-limit"],
      }));
    } catch (err: any) {
      this.logger.error(`Gagal ambil profiles dari ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return [];
    }
  }

  /**
   * Ambil semua PPPoE secret (akun pelanggan) di router.
   * Dipakai untuk import/sync akun PPPoE ke billing.
   */
  async getPppoeSecrets(
    router: Router,
  ): Promise<{ name: string; profile: string; disabled: boolean; service: string; comment?: string }[]> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const secrets = await api.menu("/ppp/secret").getAll();
      await client.close();
      return secrets.map((s: any) => ({
        name: s.name,
        profile: s.profile,
        // RouterOS mengembalikan "true"/"false" (string) atau boolean tergantung versi
        disabled: s.disabled === true || s.disabled === "true" || s.disabled === "yes",
        service: s.service,
        comment: s.comment,
      }));
    } catch (err: any) {
      this.logger.error(`Gagal ambil PPPoE secrets dari ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return [];
    }
  }

  /**
   * Ambil daftar PPPoE active connections.
   */
  async getActiveConnections(router: Router): Promise<{ name: string; address: string; uptime: string; service: string }[]> {
    const client = this.createClient(router);
    try {
      const api = await client.connect();
      const active = await api.menu("/ppp/active").getAll();
      await client.close();
      return active.map((a: any) => ({
        name: a.name,
        address: a.address,
        uptime: a.uptime,
        service: a.service,
      }));
    } catch (err: any) {
      this.logger.error(`Gagal ambil active connections dari ${router.name}: ${err.message}`);
      try { await client.close(); } catch {}
      return [];
    }
  }
}
