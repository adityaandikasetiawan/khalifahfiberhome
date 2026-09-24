import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Repository } from "typeorm";
import { SuspensionLog } from "./entities/suspension-log.entity";
import { NetworkTask } from "./entities/network-task.entity";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { UsersService } from "../users/users.service";
import { MikrotikService } from "../mikrotik/mikrotik.service";

@Injectable()
export class IsolirService {
  private readonly logger = new Logger(IsolirService.name);

  constructor(
    @InjectRepository(SuspensionLog) private readonly logRepo: Repository<SuspensionLog>,
    @InjectRepository(NetworkTask) private readonly taskRepo: Repository<NetworkTask>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usersService: UsersService,
    private readonly mikrotikService: MikrotikService,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
  ) {}

  /**
   * Membuat tugas isolir manual untuk teknisi (dipanggil oleh isolir-scheduler.job.ts
   * ketika invoice sudah overdue melewati grace period).
   */
  async createSuspendTask(subscriptionId: string, invoiceId: string, reason: string) {
    const existing = await this.taskRepo.findOne({
      where: { subscriptionId, type: "suspend", status: "pending" },
    });
    if (existing) return existing; // hindari duplikasi tugas

    const task = await this.taskRepo.save(
      this.taskRepo.create({ subscriptionId, invoiceId, type: "suspend", status: "pending", notes: reason }),
    );
    await this.logRepo.save(
      this.logRepo.create({ subscriptionId, action: "suspend", reason, triggeredBy: "system" }),
    );
    this.logger.log(`Tugas isolir dibuat untuk subscription ${subscriptionId}`);
    return task;
  }

  /**
   * Membuat tugas aktivasi ketika pembayaran diterima untuk subscription
   * yang sedang suspended (dipanggil dari payment webhook handler).
   */
  async createActivateTask(subscriptionId: string) {
    const task = await this.taskRepo.save(
      this.taskRepo.create({ subscriptionId, type: "activate", status: "pending" }),
    );
    await this.logRepo.save(
      this.logRepo.create({ subscriptionId, action: "activate", reason: "Pembayaran diterima", triggeredBy: "system" }),
    );
    return task;
  }

  /**
   * AKTIVASI OTOMATIS setelah pembayaran lunas — tanpa menunggu teknisi.
   * Dipanggil oleh IsolirProcessor untuk job "activate". Langsung:
   *   1. enable PPPoE secret di router (jika subscription tertaut router),
   *   2. set status subscription menjadi active,
   *   3. catat log & kirim notifikasi WhatsApp "layanan aktif".
   *
   * Jika router tak terjangkau, error dilempar agar BullMQ me-retry job.
   * Status subscription hanya diubah setelah router berhasil di-enable
   * (atau ketika subscription memang tidak tertaut router).
   */
  async activateSubscription(subscriptionId: string, invoiceId?: string) {
    const subscription = await this.subscriptionsService.findOne(subscriptionId);

    if (subscription.routerId && subscription.pppoeUsername) {
      const success = await this.mikrotikService.activatePppoe(
        subscription.routerId,
        subscription.pppoeUsername,
      );
      if (!success) {
        // Lempar error -> BullMQ retry (router mungkin sedang tak terjangkau).
        throw new Error(
          `Gagal enable PPPoE "${subscription.pppoeUsername}" di router untuk subscription ${subscriptionId}`,
        );
      }
      this.logger.log(`PPPoE "${subscription.pppoeUsername}" di-enable otomatis (pembayaran lunas)`);
    } else {
      this.logger.log(
        `Subscription ${subscriptionId} belum tertaut router; aktivasi hanya update status di billing`,
      );
    }

    // Sinkronkan status di database
    await this.subscriptionsService.activate(subscriptionId);
    await this.logRepo.save(
      this.logRepo.create({
        subscriptionId,
        action: "activate",
        reason: "Pembayaran lunas - aktivasi otomatis",
        triggeredBy: "system",
      }),
    );

    // Catatan: notifikasi "payment_success" ke pelanggan sudah dikirim oleh
    // PaymentsService.handleWebhook untuk setiap pembayaran lunas, jadi TIDAK
    // dikirim ulang di sini agar pelanggan tidak menerima pesan ganda.

    return { subscriptionId, activated: true };
  }

  /**
   * ISOLIR OTOMATIS ketika invoice overdue melewati grace period — tanpa
   * menunggu teknisi. Dipanggil oleh IsolirProcessor untuk job "suspend".
   * Langsung:
   *   1. disable PPPoE secret di router (kick sesi aktif juga),
   *   2. set status subscription menjadi suspended,
   *   3. catat log & kirim notifikasi WhatsApp isolir ke pelanggan.
   *
   * Jika router tak terjangkau, error dilempar agar BullMQ me-retry job.
   * Status subscription hanya diubah setelah router berhasil di-disable
   * (atau ketika subscription memang tidak tertaut router).
   */
  async suspendSubscription(subscriptionId: string, invoiceId?: string, reason?: string) {
    const subscription = await this.subscriptionsService.findOne(subscriptionId);

    // Sudah suspended -> idempoten, tidak perlu proses ulang.
    if (subscription.status === "suspended") {
      this.logger.log(`Subscription ${subscriptionId} sudah suspended, skip isolir`);
      return { subscriptionId, suspended: true, alreadySuspended: true };
    }

    if (subscription.routerId && subscription.pppoeUsername) {
      const success = await this.mikrotikService.suspendPppoe(
        subscription.routerId,
        subscription.pppoeUsername,
      );
      if (!success) {
        throw new Error(
          `Gagal disable PPPoE "${subscription.pppoeUsername}" di router untuk subscription ${subscriptionId}`,
        );
      }
      this.logger.log(`PPPoE "${subscription.pppoeUsername}" di-disable otomatis (isolir tunggakan)`);
    } else {
      this.logger.log(
        `Subscription ${subscriptionId} belum tertaut router; isolir hanya update status di billing`,
      );
    }

    await this.subscriptionsService.suspend(subscriptionId);
    await this.logRepo.save(
      this.logRepo.create({
        subscriptionId,
        action: "suspend",
        reason: reason || "Isolir otomatis - tunggakan melewati grace period",
        triggeredBy: "system",
      }),
    );

    // Notifikasi pelanggan: layanan diisolir
    if (invoiceId) {
      await this.notificationsQueue.add("isolir", {
        invoiceId,
        customerId: subscription.customerId,
      });
    }

    return { subscriptionId, suspended: true };
  }

  findTasks(status?: string, assignedTo?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    return this.taskRepo.find({ where, order: { createdAt: "ASC" } });
  }

  /**
   * Assignment eksplisit oleh admin/finance -- sebelumnya field assignedTo
   * hanya terisi otomatis dari user yang menyelesaikan tugas (completeTask),
   * belum ada cara menugaskan ke teknisi tertentu SEBELUM dikerjakan.
   */
  async assignTask(taskId: string, technicianId: string) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Tugas tidak ditemukan");
    if (task.status === "done" || task.status === "cancelled") {
      throw new BadRequestException("Tugas yang sudah selesai/dibatalkan tidak bisa di-assign ulang");
    }

    const technician = await this.usersService.findById(technicianId);
    if (!technician || technician.role !== "technician") {
      throw new BadRequestException("User yang dipilih bukan teknisi aktif");
    }

    task.assignedTo = technicianId;
    task.status = "in_progress";
    return this.taskRepo.save(task);
  }

  async completeTask(taskId: string, technicianId: string) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Tugas tidak ditemukan");

    const subscription = await this.subscriptionsService.findOne(task.subscriptionId);

    // Eksekusi otomatis ke MikroTik jika subscription punya konfigurasi router
    if (subscription.routerId && subscription.pppoeUsername) {
      try {
        if (task.type === "suspend") {
          const success = await this.mikrotikService.suspendPppoe(subscription.routerId, subscription.pppoeUsername);
          if (!success) {
            this.logger.warn(`Gagal isolir PPPoE ${subscription.pppoeUsername} di router, lanjut update status`);
          }
        } else {
          const success = await this.mikrotikService.activatePppoe(subscription.routerId, subscription.pppoeUsername);
          if (!success) {
            this.logger.warn(`Gagal aktivasi PPPoE ${subscription.pppoeUsername} di router, lanjut update status`);
          }
        }
      } catch (err: any) {
        this.logger.error(`Error komunikasi MikroTik: ${err.message}`);
        // Tidak throw error — tugas tetap diselesaikan, log error untuk monitoring
      }
    } else {
      this.logger.log(`Subscription ${task.subscriptionId} belum dikonfigurasi MikroTik, skip otomasi router`);
    }

    task.status = "done";
    task.assignedTo = technicianId;
    await this.taskRepo.save(task);

    // Sinkronkan status subscription di database
    if (task.type === "suspend") {
      await this.subscriptionsService.suspend(task.subscriptionId);
      // Kirim notifikasi WhatsApp: layanan dinonaktifkan
      if (task.invoiceId) {
        await this.notificationsQueue.add("isolir", {
          invoiceId: task.invoiceId,
          customerId: subscription.customerId,
        });
      }
    } else {
      await this.subscriptionsService.activate(task.subscriptionId);
      // Kirim notifikasi WhatsApp: layanan aktif kembali
      // Gunakan type "payment_success" karena itu template yang ada
      // dan relevan (pembayaran diterima → layanan aktif)
      if (task.invoiceId) {
        await this.notificationsQueue.add("payment_success", {
          invoiceId: task.invoiceId,
          customerId: subscription.customerId,
        });
      }
    }

    return task;
  }

  getHistory(subscriptionId: string) {
    return this.logRepo.find({ where: { subscriptionId }, order: { createdAt: "DESC" } });
  }
}
