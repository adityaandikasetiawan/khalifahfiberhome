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
          notifyUrl,
          returnUrl,
        });

        saved.gatewayReference = orderId;
        await this.repo.save(saved);

        return {
          payment: saved,
          gateway: {
            url: gatewayResponse.Url,
            paymentNo: gatewayResponse.Data?.PaymentNo,
            paymentName: gatewayResponse.Data?.PaymentName,
            expired: gatewayResponse.Data?.Expired,
            total: gatewayResponse.Data?.Total,
            transactionId: gatewayResponse.Data?.TransactionId,
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

      // Jika subscription sedang suspended karena tunggakan, trigger tugas aktivasi
      if (invoice.subscription?.status === "suspended") {
        await this.isolirQueue.add("activate", { subscriptionId: invoice.subscriptionId });
      }
    }

    return saved;
  }

  findByInvoice(invoiceId: string) {
    return this.repo.find({ where: { invoiceId }, order: { createdAt: "DESC" } });
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
