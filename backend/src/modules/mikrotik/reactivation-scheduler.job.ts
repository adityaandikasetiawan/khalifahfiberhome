import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MikrotikService } from "./mikrotik.service";

/**
 * Cron job jaring pengaman: tiap 15 menit cek pelanggan yang di billing
 * berstatus "active" (sudah bayar/lunas) TAPI PPPoE-nya masih DISABLED di
 * router, lalu ENABLE kembali secara otomatis.
 *
 * Jalur aktivasi UTAMA tetap instan lewat webhook pembayaran
 * (PaymentsService.handleWebhook -> enqueue "activate"). Cron ini HANYA
 * jaring pengaman untuk kasus webhook gagal/terlewat (mis. router sempat
 * offline saat pembayaran masuk, atau isolir manual yang lupa dibuka).
 *
 * Memanggil MikrotikService.reconcileActivations yang idempoten & aman
 * dijalankan berulang (enable PPPoE yang sudah enabled tidak berdampak).
 */
@Injectable()
export class ReactivationSchedulerJob {
  private readonly logger = new Logger(ReactivationSchedulerJob.name);
  private running = false;

  constructor(private readonly mikrotikService: MikrotikService) {}

  @Cron("0 */15 * * * *", { name: "reactivation-reconcile" })
  async handleReactivationCheck() {
    // Cegah tumpang tindih bila eksekusi sebelumnya belum selesai (mis. router
    // lambat merespons). Lewati putaran ini daripada menjalankan ganda.
    if (this.running) {
      this.logger.warn("Reaktivasi: putaran sebelumnya masih berjalan, dilewati");
      return;
    }
    this.running = true;
    try {
      const results = await this.mikrotikService.reconcileActivations(false);
      const totalFixed = results.reduce((sum, r) => sum + (r.diperbaiki?.length ?? 0), 0);
      if (totalFixed > 0) {
        this.logger.log(
          `Reaktivasi otomatis: ${totalFixed} PPPoE pelanggan lunas di-enable kembali ` +
            `(${results.map((r) => `${r.router}:${r.diperbaiki?.length ?? 0}`).join(", ")})`,
        );
      } else {
        this.logger.debug("Reaktivasi otomatis: tidak ada pelanggan lunas yang perlu di-enable");
      }
    } catch (e) {
      this.logger.error(`Reaktivasi otomatis gagal: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
