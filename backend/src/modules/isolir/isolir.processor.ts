import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { IsolirService } from "./isolir.service";

/**
 * Worker BullMQ untuk queue "isolir". Mengonsumsi job "activate" yang
 * di-push oleh PaymentsService.handleWebhook ketika pembayaran sukses
 * diterima untuk subscription yang sedang suspended.
 *
 * PENTING: sebelum processor ini ada, job hanya masuk antrian tanpa pernah
 * benar-benar membuat network_task -- ditemukan lewat e2e test
 * (test/billing-flow.e2e-spec.ts), bukan cuma dugaan.
 */
@Processor("isolir")
export class IsolirProcessor extends WorkerHost {
  private readonly logger = new Logger(IsolirProcessor.name);

  constructor(private readonly isolirService: IsolirService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === "activate") {
      const { subscriptionId, invoiceId } = job.data;
      // AKTIVASI OTOMATIS: langsung enable PPPoE di router + update status,
      // tanpa menunggu teknisi. Jika router gagal, error dilempar -> BullMQ retry.
      await this.isolirService.activateSubscription(subscriptionId, invoiceId);
      this.logger.log(`Subscription ${subscriptionId} diaktivasi otomatis (pembayaran lunas)`);
    } else if (job.name === "suspend") {
      const { subscriptionId, invoiceId, reason } = job.data;
      // ISOLIR OTOMATIS: langsung disable PPPoE di router + update status,
      // tanpa menunggu teknisi. Jika router gagal, error dilempar -> BullMQ retry.
      await this.isolirService.suspendSubscription(subscriptionId, invoiceId, reason);
      this.logger.log(`Subscription ${subscriptionId} diisolir otomatis (tunggakan overdue)`);
    }
  }
}
