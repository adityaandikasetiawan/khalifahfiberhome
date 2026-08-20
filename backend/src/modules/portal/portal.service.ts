import { Injectable, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice } from "../invoices/entities/invoice.entity";
import { CustomersService } from "../customers/customers.service";
import { PaymentsService } from "../payments/payments.service";

/**
 * Service untuk endpoint yang diakses PELANGGAN sendiri lewat portal (bukan
 * admin). Setiap query WAJIB di-scope ke customerId dari JWT -- pelanggan
 * tidak boleh bisa melihat data pelanggan lain lewat manipulasi ID di URL.
 */
@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    private readonly customersService: CustomersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getProfile(customerId: string) {
    return this.customersService.findOne(customerId);
  }

  async getMyInvoices(customerId: string) {
    return this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .leftJoinAndSelect("subscription.package", "package")
      .leftJoinAndSelect("invoice.items", "items")
      .where("customer.id = :customerId", { customerId })
      .orderBy("invoice.createdAt", "DESC")
      .getMany();
  }

  async getMyInvoiceDetail(customerId: string, invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ["subscription", "subscription.customer", "subscription.package", "items", "payments"],
    });

    // Cegah pelanggan A membuka invoice pelanggan B lewat tebak-tebak ID di URL
    if (!invoice || invoice.subscription?.customer?.id !== customerId) {
      throw new ForbiddenException("Invoice tidak ditemukan atau bukan milik Anda");
    }

    return invoice;
  }

  /**
   * Pelanggan memicu pembayaran lewat portal. Verifikasi kepemilikan invoice
   * DULU (reuse logic yang sama dengan getMyInvoiceDetail) sebelum meneruskan
   * ke PaymentsService.createTransaction -- mencegah pelanggan A membayar
   * (atau lebih buruk, memicu efek samping) untuk invoice pelanggan B.
   */
  async payInvoice(customerId: string, invoiceId: string, paymentMethod: "va" | "qris" | "ewallet") {
    await this.getMyInvoiceDetail(customerId, invoiceId); // throws ForbiddenException kalau bukan miliknya
    return this.paymentsService.createTransaction({ invoiceId, paymentMethod });
  }
}
