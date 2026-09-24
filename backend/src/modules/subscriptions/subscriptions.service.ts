import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "./entities/subscription.entity";
import { Package } from "../packages/entities/package.entity";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { MikrotikService } from "../mikrotik/mikrotik.service";

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription) private readonly repo: Repository<Subscription>,
    @InjectRepository(Package) private readonly packageRepo: Repository<Package>,
    private readonly mikrotikService: MikrotikService,
  ) {}

  async create(dto: CreateSubscriptionDto) {
    // pppoePassword bukan kolom entity -- dipakai hanya untuk membuat akun di router.
    const { pppoePassword, ...subscriptionData } = dto as any;

    const sub = this.repo.create(subscriptionData);
    const saved = (await this.repo.save(sub)) as unknown as Subscription;

    // Jika subscription tertaut router + punya username PPPoE, buat akun di MikroTik.
    // Kegagalan router TIDAK membatalkan pembuatan subscription (dicatat sebagai warning);
    // akun bisa dibuat ulang lewat sync/import.
    if (saved.routerId && saved.pppoeUsername) {
      try {
        const ok = await this.mikrotikService.createPppoeAccount(
          saved.routerId,
          saved.pppoeUsername,
          pppoePassword || saved.pppoeUsername, // fallback: password = username jika tidak diisi
          saved.mikrotikProfile || "default",
        );
        if (!ok) {
          this.logger.warn(
            `Subscription ${saved.id} dibuat, tapi gagal membuat PPPoE secret "${saved.pppoeUsername}" di router`,
          );
        }
      } catch (err: any) {
        this.logger.error(`Error membuat PPPoE secret untuk subscription ${saved.id}: ${err.message}`);
      }
    }

    return saved;
  }

  findAll(customerId?: string) {
    return this.repo.find({
      where: customerId ? { customerId } : {},
      relations: ["package", "customer"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<Subscription> {
    const sub = await this.repo.findOne({ where: { id }, relations: ["package", "customer"] });
    if (!sub) throw new NotFoundException("Subscription tidak ditemukan");
    return sub;
  }

  async update(id: string, dto: Partial<CreateSubscriptionDto>) {
    const sub = await this.findOne(id);
    const oldPackageId = sub.packageId;

    // Kalau paket diganti, tentukan profile PPPoE dari paket BARU dan siapkan
    // perubahan profile di router untuk pelanggan ini (opsi A).
    let profileToApply: string | undefined;
    if (dto.packageId && dto.packageId !== oldPackageId) {
      const newPkg = await this.packageRepo.findOne({ where: { id: dto.packageId } });
      if (!newPkg) throw new NotFoundException("Paket baru tidak ditemukan");
      // Prioritas: mikrotikProfile dari DTO (kalau dikirim) > mikrotikProfile paket baru
      profileToApply = (dto as any).mikrotikProfile || newPkg.mikrotikProfile || undefined;
      if (profileToApply) {
        (dto as any).mikrotikProfile = profileToApply; // sinkronkan ke subscription
      }
    }

    const { pppoePassword, ...rest } = dto as any;
    Object.assign(sub, rest);
    const saved = await this.repo.save(sub);

    // Terapkan perubahan profile ke router (kick sesi -> reconnect kecepatan baru).
    // Hanya jika paket berubah, subscription tertaut router+pppoe, dan status aktif.
    if (
      profileToApply &&
      saved.routerId &&
      saved.pppoeUsername &&
      saved.status === "active"
    ) {
      try {
        const ok = await this.mikrotikService.changeProfile(
          saved.routerId,
          saved.pppoeUsername,
          profileToApply,
        );
        if (!ok) {
          this.logger.warn(
            `Ganti paket subscription ${saved.id}: gagal ubah profile "${profileToApply}" di router`,
          );
        } else {
          this.logger.log(
            `Ganti paket subscription ${saved.id}: profile router diubah ke "${profileToApply}"`,
          );
        }
      } catch (err: any) {
        this.logger.error(`Error changeProfile subscription ${saved.id}: ${err.message}`);
      }
    }

    return saved;
  }

  // Digunakan oleh invoice generator job untuk mencari subscription yang jatuh tempo hari ini
  findAllActive() {
    return this.repo.find({
      where: { status: "active" },
      relations: ["package", "customer"],
    });
  }

  findActiveDueToday(billingDay: number) {
    return this.repo.find({
      where: { status: "active", billingDay },
      relations: ["package", "customer"],
    });
  }

  async suspend(id: string) {
    const sub = await this.findOne(id);
    sub.status = "suspended";
    return this.repo.save(sub);
  }

  async activate(id: string) {
    const sub = await this.findOne(id);
    sub.status = "active";
    return this.repo.save(sub);
  }
}
