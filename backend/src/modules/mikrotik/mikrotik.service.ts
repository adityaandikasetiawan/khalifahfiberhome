import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Router } from "./entities/router.entity";
import { MikrotikApiService } from "./mikrotik-api.service";
import { CredentialVaultService } from "./credential-vault.service";
import { CreateRouterDto } from "./dto/create-router.dto";
import { UpdateRouterDto } from "./dto/update-router.dto";

@Injectable()
export class MikrotikService {
  private readonly logger = new Logger(MikrotikService.name);

  constructor(
    @InjectRepository(Router) private readonly routerRepo: Repository<Router>,
    private readonly mikrotikApi: MikrotikApiService,
    private readonly vault: CredentialVaultService,
  ) {}

  /** Ganti password API dengan penanda tersamar untuk respons ke klien. */
  private maskRouter(router: Router): Router {
    return { ...router, password: this.vault.mask(router.password) } as Router;
  }

  // ─── CRUD Router ───────────────────────────────────────────────

  async create(dto: CreateRouterDto) {
    const router = this.routerRepo.create(dto);
    // Enkripsi password API sebelum disimpan (at-rest).
    router.password = this.vault.encrypt(dto.password);
    const saved = await this.routerRepo.save(router);
    return this.maskRouter(saved);
  }

  async findAll() {
    const routers = await this.routerRepo.find({ order: { name: "ASC" } });
    return routers.map((r) => this.maskRouter(r));
  }

  /**
   * Ambil router untuk keperluan INTERNAL (koneksi ke router). Password tetap
   * dalam bentuk tersimpan (terenkripsi) dan didekripsi oleh MikrotikApiService.
   * JANGAN kembalikan hasil method ini langsung ke respons API.
   */
  async findOne(id: string): Promise<Router> {
    const router = await this.routerRepo.findOne({ where: { id } });
    if (!router) throw new NotFoundException("Router tidak ditemukan");
    return router;
  }

  /** Versi ter-mask untuk respons API. */
  async findOneMasked(id: string): Promise<Router> {
    return this.maskRouter(await this.findOne(id));
  }

  async update(id: string, dto: UpdateRouterDto) {
    const router = await this.findOne(id);
    const { password, ...rest } = dto as any;
    Object.assign(router, rest);
    // Pertahankan password lama jika field password dikirim kosong/tidak ada.
    if (password !== undefined && password !== null && password !== "") {
      router.password = this.vault.encrypt(password);
    }
    const saved = await this.routerRepo.save(router);
    return this.maskRouter(saved);
  }

  async remove(id: string) {
    const router = await this.findOne(id);
    router.isActive = false;
    const saved = await this.routerRepo.save(router);
    return this.maskRouter(saved);
  }

  async testConnection(id: string) {
    const router = await this.findOne(id);
    return this.mikrotikApi.testConnection(router);
  }

  // ─── Operasi PPPoE (dipanggil oleh IsolirService) ─────────────

  /**
   * Isolir pelanggan: disable PPPoE secret di router terkait.
   * routerId bisa disimpan di subscription atau dipilih berdasarkan area.
   */
  async suspendPppoe(routerId: string, pppoeUsername: string): Promise<boolean> {
    const router = await this.findOne(routerId);
    if (!router.isActive) {
      this.logger.warn(`Router ${router.name} tidak aktif, skip isolir`);
      return false;
    }
    return this.mikrotikApi.disablePppoeSecret(router, pppoeUsername);
  }

  /**
   * Aktivasi pelanggan: enable PPPoE secret di router terkait.
   */
  async activatePppoe(routerId: string, pppoeUsername: string): Promise<boolean> {
    const router = await this.findOne(routerId);
    if (!router.isActive) {
      this.logger.warn(`Router ${router.name} tidak aktif, skip aktivasi`);
      return false;
    }
    return this.mikrotikApi.enablePppoeSecret(router, pppoeUsername);
  }

  /**
   * Buat akun PPPoE baru di router (dipanggil saat subscription baru dibuat
   * dari admin panel dengan routerId + pppoeUsername terisi).
   * Idempoten di sisi API (skip jika secret sudah ada).
   */
  async createPppoeAccount(
    routerId: string,
    pppoeUsername: string,
    pppoePassword: string,
    profileName: string,
  ): Promise<boolean> {
    const router = await this.findOne(routerId);
    if (!router.isActive) {
      this.logger.warn(`Router ${router.name} tidak aktif, skip create PPPoE`);
      return false;
    }
    return this.mikrotikApi.createPppoeSecret(router, pppoeUsername, pppoePassword, profileName || "default");
  }

  /**
   * Ganti profile/speed PPPoE secret.
   */
  async changeProfile(routerId: string, pppoeUsername: string, profileName: string): Promise<boolean> {
    const router = await this.findOne(routerId);
    if (!router.isActive) return false;
    return this.mikrotikApi.updatePppoeProfile(router, pppoeUsername, profileName);
  }

  /**
   * Ambil daftar PPPoE profiles di suatu router.
   */
  async getProfiles(id: string) {
    const router = await this.findOne(id);
    return this.mikrotikApi.getPppoeProfiles(router);
  }

  /**
   * Gabungan nama profile PPPoE dari SEMUA router aktif (distinct), untuk
   * dropdown pemilihan profile di form paket admin. Router yang tak terjangkau
   * dilewati (tidak menggagalkan seluruh daftar).
   */
  async getAllProfileNames(): Promise<string[]> {
    const routers = await this.routerRepo.find({ where: { isActive: true } });
    const set = new Set<string>();
    for (const router of routers) {
      try {
        const profiles = await this.mikrotikApi.getPppoeProfiles(router);
        profiles.forEach((p) => p.name && set.add(p.name));
      } catch (err: any) {
        this.logger.warn(`Gagal ambil profile dari ${router.name}: ${err.message}`);
      }
    }
    return Array.from(set).sort();
  }

  /**
   * Tambah profile PPPoE baru di router (tidak menghapus/mengubah yang ada).
   */
  async createProfile(
    routerId: string,
    name: string,
    rateLimit?: string,
    localAddress?: string,
    remoteAddress?: string,
  ): Promise<boolean> {
    const router = await this.findOne(routerId);
    if (!router.isActive) return false;
    return this.mikrotikApi.createPppoeProfile(router, name, rateLimit, localAddress, remoteAddress);
  }

  /**
   * Ambil daftar koneksi aktif di suatu router.
   */
  async getActiveConnections(id: string) {
    const router = await this.findOne(id);
    return this.mikrotikApi.getActiveConnections(router);
  }
}
