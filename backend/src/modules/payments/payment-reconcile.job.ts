import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PaymentsService } from "./payments.service";

/**
 * Cron JARING PENGAMAN WEBHOOK: tiap 5 menit cek semua pembayaran yang masih
 * "pending" langsung ke iPaymu (checkTransaction). Kalau pelanggan ternyata
 * SUDAH bayar tapi webhook iPaymu tidak sampai, pembayaran dikonfirmasi lunas
 * + layanan diaktifkan otomatis — tanpa perlu admin konfirmasi manual.
 *
 * Jalur aktivasi UTAMA tetap webhook (instan). Cron ini hanya menangkap kasus
 * webhook gagal/terlambat. Idempoten & aman dijalankan berulang.
 */
@Injectable()
export class PaymentReconcileJob {
  private readonly logger = new Logger(PaymentReconcileJob.name);
  private running = false;

  constructor(private readonly paymentsService: PaymentsService) {}

  @Cron("0 */5 * * * *", { name: "payment-reconcile" })
  async handleReconcile() {
    // Cegah tumpang tindih bila putaran sebelumnya belum selesai (iPaymu lambat).
    if (this.running) {
      this.logger.warn("Reconcile pembayaran: putaran sebelumnya masih berjalan, dilewati");
      return;
    }
    this.running = true;
    try {
      const { checked, confirmed } = await this.paymentsService.reconcilePendingPayments();
      if (confirmed > 0) {
        this.logger.log(`Reconcile pembayaran: ${confirmed} dari ${checked} pending dikonfirmasi lunas`);
      }
    } catch (e) {
      this.logger.error(`Reconcile pembayaran gagal: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
