import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Router } from "./entities/router.entity";
import { MikrotikApiService } from "./mikrotik-api.service";
import { CreateRouterDto } from "./dto/create-router.dto";
import { UpdateRouterDto } from "./dto/update-router.dto";

@Injectable()
export class MikrotikService {
  private readonly logger = new Logger(MikrotikService.name);

  constructor(
    @InjectRepository(Router) private readonly routerRepo: Repository<Router>,
    private readonly mikrotikApi: MikrotikApiService,
  ) {}

  // ─── CRUD Router ───────────────────────────────────────────────

  create(dto: CreateRouterDto) {
    const router = this.routerRepo.create(dto);
    return this.routerRepo.save(router);
  }

  findAll() {
    return this.routerRepo.find({ order: { name: "ASC" } });
  }

  async findOne(id: string): Promise<Router> {
    const router = await this.routerRepo.findOne({ where: { id } });
    if (!router) throw new NotFoundException("Router tidak ditemukan");
    return router;
  }

  async update(id: string, dto: UpdateRouterDto) {
    const router = await this.findOne(id);
    Object.assign(router, dto);
    return this.routerRepo.save(router);
  }

  async remove(id: string) {
    const router = await this.findOne(id);
    router.isActive = false;
    return this.routerRepo.save(router);
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
   * Ambil daftar koneksi aktif di suatu router.
   */
  async getActiveConnections(id: string) {
    const router = await this.findOne(id);
    return this.mikrotikApi.getActiveConnections(router);
  }
}
