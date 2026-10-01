import { Injectable, NotFoundException, BadRequestException, Logger, ServiceUnavailableException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ConfigService } from "@nestjs/config";
import { Payment } from "./entities/payment.entity";
import { InvoicesService } from "../invoices/invoices.service";
import { MidtransProvider } from "./gateways/midtrans.provider";
import { IpaymuProvider } from "./gateways/ipaymu.provider";
import { CreatePaymentTransactionDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    private readonly invoicesService: InvoicesService,
    private readonly midtransProvider: MidtransProvider,
    private readonly ipaymuProvider: IpaymuProvider,
    private readonly config: ConfigService,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
    @InjectQueue("isolir") private readonly isolirQueue: Queue,
  ) {}

  async createTransaction(dto: CreatePaymentTransactionDto) {
    const invoice = await this.invoicesService.findOne(dto.invoiceId);
    if (invoice.status === "paid") {
      throw new BadRequestException("Invoice sudah lunas");
    }

    const payment = this.repo.create({
      invoiceId: invoice.id,
      paymentMethod: dto.paymentMethod === "va" ? "va" : dto.paymentMethod === "qris" ? "qris" : "ewallet",
      amount: invoice.totalAmount,
      status: "pending",
    });
    const saved = await this.repo.save(payment);

    const orderId = `${invoice.invoiceNumber}-${saved.id.slice(0, 8)}`;

    // Mode simulasi -- HANYA aktif kalau PAYMENT_PROVIDER=mock secara eksplisit
    // di .env (default-nya tetap Midtrans sungguhan). Dipakai untuk menguji
    // alur penuh invoice -> bayar -> webhook -> aktivasi tanpa kredensial
    // sandbox asli. TIDAK PERNAH aktif di production kecuali diset sengaja.
    if (this.config.get("PAYMENT_PROVIDER") === "mock") {
      this.logger.warn(
        `[MOCK PAYMENT] Membuat transaksi simulasi untuk ${orderId} -- JANGAN gunakan mode ini di production`,
      );
      saved.gatewayReference = orderId;
      await this.repo.save(saved);
      return {
        payment: saved,
        gateway: {
          mock: true,
          order_id: orderId,
          message: "Mode simulasi aktif. Gunakan POST /payments/mock/:paymentId/simulate untuk menyelesaikan pembayaran ini.",
        },
      };
    }

    try {
      const provider = this.config.get("PAYMENT_PROVIDER", "ipaymu");

      if (provider === "ipaymu") {
        // iPaymu Direct Payment
        const notifyUrl = this.config.get("IPAYMU_NOTIFY_URL", "http://localhost:3000/api/v1/webhooks/payment-gateway/ipaymu");
        const returnUrl = this.config.get("IPAYMU_RETURN_URL", "http://localhost:3001/invoices");

        const gatewayResponse = await this.ipaymuProvider.createTransaction({
          orderId,
          amount: Number(invoice.totalAmount),
          customerName: invoice.subscription?.customer?.name ?? "Pelanggan",
          customerPhone: invoice.subscription?.customer?.phone,
          customerEmail: invoice.subscription?.customer?.email,
          paymentMethod: dto.paymentMethod as "va" | "qris" | "ewallet",
          paymentChannel: dto.paymentChannel,
          notifyUrl,
          returnUrl,
        });

        saved.gatewayReference = orderId;
        saved.rawPayload = { transactionId: gatewayResponse.Data?.TransactionId };
        await this.repo.save(saved);

        return {
          payment: saved,
          gateway: {
            url: gatewayResponse.Url ?? (gatewayResponse.Data as any)?.Url,
            paymentNo: gatewayResponse.Data?.PaymentNo,
            paymentName: gatewayResponse.Data?.PaymentName,
            expired: gatewayResponse.Data?.Expired,
            total: gatewayResponse.Data?.Total,
            subTotal: gatewayResponse.Data?.SubTotal,
            fee: gatewayResponse.Data?.Fee,
            transactionId: gatewayResponse.Data?.TransactionId,
            qrString: gatewayResponse.Data?.QrString,
            qrImage: gatewayResponse.Data?.QrImage,
            paymentMethod: dto.paymentMethod,
          },
        };
      } else {
        // Midtrans (legacy)
        const gatewayResponse = await this.midtransProvider.createTransaction({
          orderId,
          amount: Number(invoice.totalAmount),
          customerName: invoice.subscription?.customer?.name ?? "Pelanggan",
        });

        saved.gatewayReference = gatewayResponse.token ?? gatewayResponse.order_id;
        await this.repo.save(saved);

        return { payment: saved, gateway: gatewayResponse };
      }
    } catch (err) {
      // Tandai payment gagal alih-alih dibiarkan menggantung berstatus "pending"
      // tanpa gatewayReference -- entri seperti itu tidak bisa dilacak lagi.
      saved.status = "failed";
      await this.repo.save(saved);

      this.logger.error(`Gagal membuat transaksi di payment gateway untuk invoice ${invoice.id}`, err as Error);
      throw new ServiceUnavailableException(
        "Tidak bisa terhubung ke payment gateway saat ini. Pastikan kredensial gateway sudah dikonfigurasi dengan benar di .env, atau coba lagi nanti.",
      );
    }
  }

  /**
   * Menangani webhook payment gateway secara IDEMPOTENT.
   * Webhook bisa terkirim lebih dari sekali oleh provider -- payment yang
   * sudah berstatus "success" tidak boleh diproses ulang.
   */
  async handleWebhook(params: {
    gatewayReference: string;
    status: "success" | "failed" | "expired";
    rawPayload: Record<string, any>;
  }) {
    const payment = await this.repo.findOne({ where: { gatewayReference: params.gatewayReference } });
    if (!payment) {
      this.logger.warn(`Webhook diterima untuk reference tidak dikenal: ${params.gatewayReference}`);
      throw new NotFoundException("Payment reference tidak ditemukan");
    }

    // Idempotency guard: jika sudah sukses sebelumnya, jangan proses ulang
    if (payment.status === "success") {
      this.logger.log(`Payment ${payment.id} sudah diproses sebelumnya, mengabaikan webhook duplikat`);
      return payment;
    }

    payment.status = params.status;
    payment.rawPayload = params.rawPayload;
    if (params.status === "success") {
      payment.paidAt = new Date();
    }
    const saved = await this.repo.save(payment);

    if (params.status === "success") {
      const invoice = await this.invoicesService.markAsPaid(payment.invoiceId);

      await this.notificationsQueue.add("payment_success", {
        invoiceId: invoice.id,
        customerId: invoice.subscription?.customer?.id,
      });

      // Notifikasi WA ke ADMIN setiap ada pembayaran pelanggan masuk.
      // Nomor admin dari env ADMIN_WA_NUMBER (dukung beberapa nomor, pisah koma).
      const adminWa = this.config.get<string>("ADMIN_WA_NUMBER", "");
      if (adminWa) {
        await this.notificationsQueue.add(
          "admin_payment_alert",
          {
            adminNumbers: adminWa,
            invoiceId: invoice.id,
            amount: Number(invoice.totalAmount),
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.subscription?.customer?.name,
            customerNumber: invoice.subscription?.customer?.customerNumber,
            paidAt: new Date().toISOString(),
          },
          { attempts: 5, backoff: { type: "exponential", delay: 30000 } },
        );
      }

      const subscription = invoice.subscription;
      const customer = subscription?.customer;

      // PEMBAYARAN REGISTRASI PELANGGAN BARU:
      // Jika ini pembayaran pertama registrasi (subscription pending_activation),
      // JANGAN aktifkan router. Set status menjadi "menunggu approval teknisi"
      // (customer=pending_active). PPPoE baru dibuat & di-enable saat teknisi
      // meng-approve lewat endpoint approval.
      if (subscription?.status === "pending_activation") {
        await this.markPendingActivation(subscription.id, customer?.id);
        this.logger.log(
          `Pembayaran registrasi pelanggan baru (sub ${subscription.id}) diterima -> menunggu approval teknisi`,
        );
      } else if (subscription?.status === "suspended") {
        // PELANGGAN LAMA yang tersuspend karena tunggakan -> aktivasi OTOMATIS
        // ke router (enable PPPoE) via queue isolir. Retry ditangani BullMQ.
        await this.isolirQueue.add(
          "activate",
          { subscriptionId: invoice.subscriptionId, invoiceId: invoice.id },
          { attempts: 5, backoff: { type: "exponential", delay: 30000 } },
        );
      }
    }

    return saved;
  }

  /**
   * Tandai pelanggan baru sebagai "menunggu approval teknisi" setelah membayar
   * biaya registrasi. Subscription tetap pending_activation (belum active),
   * customer -> pending_active. PPPoE TIDAK dibuat/di-enable di sini; itu
   * dilakukan saat teknisi meng-approve.
   */
  private async markPendingActivation(subscriptionId: string, customerId?: string) {
    const mgr = this.repo.manager;
    if (customerId) {
      await mgr.query(`UPDATE customers SET status = 'pending_active' WHERE id = $1`, [customerId]);
    }
    // subscription dibiarkan pending_activation sampai teknisi approve.
    void subscriptionId;
  }

  /**
   * Cek status pembayaran terkini ke iPaymu (fallback kalau webhook belum masuk).
   * Ambil payment pending terbaru untuk invoice, tanya statusnya ke iPaymu,
   * lalu proses lewat handleWebhook yang sama (idempoten) kalau sudah sukses.
   */
  async checkPaymentStatus(invoiceId: string) {
    const invoice = await this.invoicesService.findOne(invoiceId);
    if (invoice.status === "paid") {
      return { status: "paid", message: "Invoice sudah lunas" };
    }

    // Ambil payment pending terbaru yang punya transactionId
    const payments = await this.repo.find({
      where: { invoiceId },
      order: { createdAt: "DESC" },
    });
    const pending = payments.find((p) => p.status === "pending" && p.rawPayload?.transactionId);

    if (!pending || !pending.rawPayload?.transactionId) {
      return { status: invoice.status, message: "Belum ada transaksi pembayaran yang bisa dicek" };
    }

    if (this.config.get("PAYMENT_PROVIDER") !== "ipaymu") {
      return { status: invoice.status, message: "Cek status hanya tersedia untuk iPaymu" };
    }

    try {
      const result = await this.ipaymuProvider.checkTransaction(pending.rawPayload.transactionId);
      if (result.status === "success") {
        // Proses lewat jalur webhook yang sama (idempoten)
        await this.handleWebhook({
          gatewayReference: pending.gatewayReference!,
          status: "success",
          rawPayload: { ...pending.rawPayload, checkedManually: true, ipaymuResponse: result.raw },
        });
        return { status: "paid", message: "Pembayaran terkonfirmasi. Invoice lunas." };
      }
      return {
        status: result.status,
        message:
          result.status === "pending"
            ? "Pembayaran belum diterima. Jika sudah bayar, tunggu beberapa menit lalu cek lagi."
            : "Transaksi kedaluwarsa atau gagal. Silakan buat pembayaran baru.",
      };
    } catch (err) {
      this.logger.error(`Gagal cek status pembayaran invoice ${invoiceId}`, err as Error);
      return { status: invoice.status, message: "Gagal menghubungi payment gateway. Coba lagi nanti." };
    }
  }

  findByInvoice(invoiceId: string) {
    return this.repo.find({ where: { invoiceId }, order: { createdAt: "DESC" } });
  }

  /**
   * Histori pembayaran untuk panel admin. Mendukung filter status, rentang
   * tanggal (createdAt), pencarian (nama/nomor pelanggan/nomor invoice/referensi
   * gateway), dan paging. Mengembalikan data + total untuk kebutuhan tabel admin.
   */
  async findAll(query: {
    status?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 25));

    const qb = this.buildListQuery(query);
    qb.orderBy("payment.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map((p) => this.toListRow(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** CSV export histori pembayaran dengan filter yang sama (tanpa paging). */
  async exportCsv(query: { status?: string; from?: string; to?: string; search?: string }): Promise<string> {
    const qb = this.buildListQuery(query).orderBy("payment.createdAt", "DESC");
    const rows = await qb.getMany();

    const header = ["Tanggal", "Pelanggan", "No Pelanggan", "No Invoice", "Metode", "Jumlah", "Status", "Dibayar", "Referensi"];
    const csvEscape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(",")];
    for (const p of rows) {
      const r = this.toListRow(p);
      lines.push(
        [
          r.createdAt ? new Date(r.createdAt).toISOString() : "",
          csvEscape(r.customerName),
          csvEscape(r.customerNumber),
          csvEscape(r.invoiceNumber),
          r.paymentMethod,
          r.amount,
          r.status,
          r.paidAt ? new Date(r.paidAt).toISOString() : "",
          csvEscape(r.gatewayReference),
        ].join(","),
      );
    }
    return lines.join("\n");
  }

  private buildListQuery(query: { status?: string; from?: string; to?: string; search?: string }) {
    const qb = this.repo
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.invoice", "invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer");

    if (query.status) {
      qb.andWhere("payment.status = :status", { status: query.status });
    }
    if (query.from) {
      qb.andWhere("payment.createdAt >= :from", { from: new Date(query.from) });
    }
    if (query.to) {
      // inklusif sampai akhir hari 'to'
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere("payment.createdAt <= :to", { to });
    }
    if (query.search) {
      qb.andWhere(
        "(customer.name ILIKE :q OR customer.\"customerNumber\" ILIKE :q OR invoice.\"invoiceNumber\" ILIKE :q OR payment.\"gatewayReference\" ILIKE :q)",
        { q: `%${query.search}%` },
      );
    }
    return qb;
  }

  private toListRow(p: Payment) {
    const customer = p.invoice?.subscription?.customer;
    return {
      id: p.id,
      createdAt: p.createdAt,
      paidAt: p.paidAt ?? null,
      amount: Number(p.amount),
      status: p.status,
      paymentMethod: p.paymentMethod,
      gatewayReference: p.gatewayReference ?? null,
      invoiceId: p.invoiceId,
      invoiceNumber: p.invoice?.invoiceNumber ?? null,
      customerName: customer?.name ?? null,
      customerNumber: customer?.customerNumber ?? null,
    };
  }

  /**
   * Simulasi penyelesaian pembayaran untuk transaksi yang dibuat dalam mode
   * mock (PAYMENT_PROVIDER=mock). Memanggil ULANG logic handleWebhook yang
   * sama persis dengan yang dipakai webhook Midtrans/Xendit sungguhan --
   * jadi ini bukan jalur pintas terpisah, melainkan cara memicu jalur
   * produksi yang sama tanpa perlu payment gateway asli.
   *
   * DIBLOKIR total kalau PAYMENT_PROVIDER bukan "mock", termasuk di production.
   */
  async simulateMockPayment(paymentId: string, outcome: "success" | "failed") {
    if (this.config.get("PAYMENT_PROVIDER") !== "mock") {
      throw new BadRequestException(
        "Simulasi pembayaran hanya tersedia saat PAYMENT_PROVIDER=mock. Fitur ini nonaktif di lingkungan ini.",
      );
    }

    const payment = await this.repo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException("Payment tidak ditemukan");
    if (!payment.gatewayReference) {
      throw new BadRequestException("Payment ini tidak punya gatewayReference (bukan hasil mode mock)");
    }

    return this.handleWebhook({
      gatewayReference: payment.gatewayReference,
      status: outcome,
      rawPayload: { simulated: true, outcome, simulatedAt: new Date().toISOString() },
    });
  }
}
