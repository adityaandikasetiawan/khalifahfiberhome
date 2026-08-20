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
      const { subscriptionId } = job.data;
      await this.isolirService.createActivateTask(subscriptionId);
      this.logger.log(`Tugas aktivasi dibuat untuk subscription ${subscriptionId} (dari job queue)`);
    }
  }
}
