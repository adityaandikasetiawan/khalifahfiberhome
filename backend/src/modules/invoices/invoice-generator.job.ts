import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { InvoicesService } from "./invoices.service";

/**
 * Cron job harian: generate invoice untuk semua subscription aktif
 * yang billingDay-nya jatuh pada tanggal hari ini, lalu men-trigger
 * notifikasi via queue.
 *
 * PENTING: pada deployment multi-instance (PM2 cluster), job ini hanya boleh
 * dijalankan pada SATU worker khusus untuk menghindari invoice double-generate.
 * Gunakan proses worker terpisah dari proses API (lihat docker-compose.yml).
 */
@Injectable()
export class InvoiceGeneratorJob {
  private readonly logger = new Logger(InvoiceGeneratorJob.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoicesService: InvoicesService,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
  ) {}

  /**
   * DINONAKTIFKAN sejak model billing diubah menjadi "masa aktif = tanggal
   * bayar + 1 bulan kalender".
   *
   * Dulu cron ini men-generate invoice berdasarkan billingDay (periode kalender
   * 01-akhir bulan). Dengan model baru, penagihan PERPANJANGAN ditangani oleh
   * cron RENEWAL (handleRenewalGeneration, H-3 sebelum masa aktif habis). Jika
   * cron ini tetap aktif, ia membuat invoice periode-kalender yang DOBEL dengan
   * invoice renewal/manual (ditemukan sebagai "invoice hantu" 01-31 Okt).
   *
   * Invoice AWAL pelanggan baru dibuat saat registrasi / oleh admin (endpoint
   * create invoice manual), bukan oleh cron ini.
   *
   * Sengaja TIDAK dihapus total agar jejak keputusan jelas; body dikosongkan
   * sehingga tidak ada invoice yang dibuat.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyInvoiceGeneration() {
    this.logger.debug(
      "handleDailyInvoiceGeneration dinonaktifkan (model billing = tgl bayar + 1 bulan). " +
        "Perpanjangan ditangani cron renewal H-3.",
    );
    return;
  }

  // Menandai invoice yang lewat jatuh tempo sebagai "overdue", dijalankan tiap dini hari
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleMarkOverdue() {
    const affected = await this.invoicesService.markOverdueInvoices();
    this.logger.log(`${affected} invoice ditandai sebagai overdue`);
  }

  /**
   * Cron RENEWAL: 3 hari sebelum masa aktif langganan berakhir, generate
   * invoice perpanjangan untuk periode 1 bulan berikutnya lalu kirim ke
   * pelanggan. "Masa aktif" = periodEnd dari invoice LUNAS terakhir.
   *
   * Hari H-x dikonfigurasi via env INVOICE_RENEWAL_DAYS_BEFORE (default 3).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleRenewalGeneration() {
    const daysBefore = parseInt(process.env.INVOICE_RENEWAL_DAYS_BEFORE ?? "3", 10);
    const subs = await this.subscriptionsService.findAllActive();
    this.logger.log(`Renewal check untuk ${subs.length} subscription aktif (H-${daysBefore})`);

    for (const sub of subs) {
      try {
        const activeUntil = await this.invoicesService.getActiveUntil(sub.id);
        if (!activeUntil) continue; // belum pernah bayar, invoice awal ditangani manual/proses lain

        // Cek apakah hari ini = H-x sebelum masa aktif berakhir
        const trigger = new Date(activeUntil);
        trigger.setDate(trigger.getDate() - daysBefore);
        const today = new Date();
        const sameDay =
          trigger.getFullYear() === today.getFullYear() &&
          trigger.getMonth() === today.getMonth() &&
          trigger.getDate() === today.getDate();
        if (!sameDay) continue;

        // Periode baru (PERKIRAAN saat terbit; final ditentukan markAsPaid saat
        // dibayar): mulai sehari setelah masa aktif berakhir, selama 1 bulan
        // kalender.
        const periodStart = new Date(activeUntil);
        periodStart.setDate(periodStart.getDate() + 1);
        const periodEnd = new Date(periodStart);
        const psDay = periodStart.getDate();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        if (periodEnd.getDate() !== psDay) {
          periodEnd.setDate(0);
        }
        periodEnd.setDate(periodEnd.getDate() - 1);

        const invoice = await this.invoicesService.generateRenewalInvoice(sub, periodStart, periodEnd);
        if (invoice) {
          await this.notificationsQueue.add("invoice_created", {
            customerId: sub.customer.id,
            invoiceId: invoice.id,
          });
          this.logger.log(`Invoice perpanjangan dikirim untuk subscription ${sub.id}`);
        }
      } catch (err) {
        this.logger.error(`Gagal proses renewal subscription ${sub.id}`, err as Error);
      }
    }
  }
}
