import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Router } from "./entities/router.entity";
import { Customer } from "../customers/entities/customer.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";
import { Package } from "../packages/entities/package.entity";
import { MikrotikApiService } from "./mikrotik-api.service";

export interface ImportResult {
  routerId: string;
  totalSecrets: number;
  imported: number;
  skipped: number;
  details: {
    pppoeUsername: string;
    profile: string;
    status: "imported" | "skipped_existing";
    subscriptionId?: string;
    customerNumber?: string;
  }[];
}

/**
 * Layanan import/sinkronisasi akun PPPoE dari router MikroTik ke billing.
 * Untuk setiap PPPoE secret di router yang belum punya subscription di billing,
 * dibuatkan Customer + Subscription placeholder yang sudah tertaut ke router
 * (routerId, pppoeUsername, mikrotikProfile). Data pelanggan (nama/telp/alamat)
 * diisi placeholder dan bisa dilengkapi admin lewat panel.
 *
 * Idempoten: secret yang sudah pernah diimport (dicocokkan via pppoeUsername +
 * routerId pada subscription) akan dilewati, sehingga import bisa dijalankan
 * berulang sebagai "sync".
 */
@Injectable()
export class MikrotikImportService {
  private readonly logger = new Logger(MikrotikImportService.name);

  constructor(
    @InjectRepository(Router) private readonly routerRepo: Repository<Router>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Package) private readonly packageRepo: Repository<Package>,
    private readonly mikrotikApi: MikrotikApiService,
  ) {}

  /**
   * Petakan nama profile PPPoE router ke Package billing. Jika belum ada
   * package dengan mikrotikProfile yang cocok, buat package baru otomatis.
   * Contoh profile: "4M/4M", "10M/10M", "15M/15M".
   */
  private async resolvePackageForProfile(profile: string): Promise<Package> {
    const profileName = profile?.trim() || "default";

    // Cari package yang namanya mengandung profile (mis. "PPPoE 10M/10M")
    const existing = await this.packageRepo.findOne({
      where: { name: `PPPoE ${profileName}` },
    });
    if (existing) return existing;

    // Tebak speed dari nama profile (angka pertama sebelum "M")
    const speedMatch = profileName.match(/(\d+)\s*M/i);
    const speedMbps = speedMatch ? parseInt(speedMatch[1], 10) : 0;

    const pkg = this.packageRepo.create({
      name: `PPPoE ${profileName}`,
      speedMbps,
      price: 0, // harga diisi admin belakangan
      billingCycle: "monthly",
      isActive: true,
    });
    const saved = await this.packageRepo.save(pkg);
    this.logger.log(`Package baru dibuat untuk profile "${profileName}": ${saved.id}`);
    return saved;
  }

  private async generateCustomerNumber(seq: number): Promise<string> {
    // Format KHA-XXX; jika bentrok, tambah suffix waktu
    const candidate = `KHA-${String(seq).padStart(3, "0")}`;
    const clash = await this.customerRepo.findOne({ where: { customerNumber: candidate } });
    if (!clash) return candidate;
    return `KHA-${Date.now().toString().slice(-6)}`;
  }

  /**
   * Import seluruh PPPoE secret dari router menjadi customer + subscription.
   */
  async importFromRouter(routerId: string): Promise<ImportResult> {
    const router = await this.routerRepo.findOne({ where: { id: routerId } });
    if (!router) throw new NotFoundException("Router tidak ditemukan");

    const secrets = await this.mikrotikApi.getPppoeSecrets(router);
    // Hanya proses service pppoe
    const pppoeSecrets = secrets.filter((s) => !s.service || s.service === "pppoe" || s.service === "any");

    const result: ImportResult = {
      routerId,
      totalSecrets: pppoeSecrets.length,
      imported: 0,
      skipped: 0,
      details: [],
    };

    // Nomor pelanggan berurutan mulai dari jumlah customer saat ini + 1
    let seqBase = (await this.customerRepo.count()) + 1;

    for (const secret of pppoeSecrets) {
      // Idempotensi: lewati kalau subscription dengan pppoeUsername+routerId sudah ada
      const existingSub = await this.subscriptionRepo.findOne({
        where: { pppoeUsername: secret.name, routerId },
      });
      if (existingSub) {
        result.skipped++;
        result.details.push({
          pppoeUsername: secret.name,
          profile: secret.profile,
          status: "skipped_existing",
          subscriptionId: existingSub.id,
        });
        continue;
      }

      const pkg = await this.resolvePackageForProfile(secret.profile);
      const customerNumber = await this.generateCustomerNumber(seqBase++);

      // Buat customer placeholder
      const customer = await this.customerRepo.save(
        this.customerRepo.create({
          customerNumber,
          name: secret.comment?.trim() || secret.name, // pakai comment sebagai nama jika ada
          phone: "",
          address: "-",
          status: secret.disabled ? "suspended" : "active",
        }),
      );

      // Buat subscription tertaut ke router
      const today = new Date();
      const billingDay = Math.min(Math.max(today.getDate(), 1), 28);
      const subscription = await this.subscriptionRepo.save(
        this.subscriptionRepo.create({
          customerId: customer.id,
          packageId: pkg.id,
          startDate: today.toISOString().slice(0, 10) as any,
          billingDay,
          status: secret.disabled ? "suspended" : "active",
          pppoeUsername: secret.name,
          mikrotikProfile: secret.profile,
          routerId,
        }),
      );

      result.imported++;
      result.details.push({
        pppoeUsername: secret.name,
        profile: secret.profile,
        status: "imported",
        subscriptionId: subscription.id,
        customerNumber,
      });
    }

    this.logger.log(
      `Import PPPoE dari router ${router.name}: ${result.imported} baru, ${result.skipped} dilewati, dari total ${result.totalSecrets}`,
    );
    return result;
  }
}
