import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { Subscription } from "../subscriptions/entities/subscription.entity";

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private readonly itemRepo: Repository<InvoiceItem>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  private generateInvoiceNumber(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${y}${m}-${rand}`;
  }

  /**
   * Membuat invoice manual (mis. biaya instalasi/tambahan di luar siklus bulanan).
   */
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const subscription = await this.subscriptionRepo.findOne({ where: { id: dto.subscriptionId } });
    if (!subscription) throw new NotFoundException("Subscription tidak ditemukan");
    if (!dto.items.length) throw new BadRequestException("Invoice harus memiliki minimal 1 item");

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 7);

    const items = dto.items.map((i) =>
      this.itemRepo.create({ ...i, subtotal: i.qty * i.unitPrice }),
    );
    const amount = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      subscriptionId: subscription.id,
      periodStart: now,
      periodEnd: now,
      amount,
      taxAmount: 0,
      totalAmount: amount,
      dueDate,
      status: "unpaid",
      items,
    });

    return this.invoiceRepo.save(invoice);
  }

  /**
   * Dipanggil oleh cron job harian (lihat invoice-generator.job.ts).
   * Membuat invoice bulanan otomatis untuk semua subscription yang billingDay-nya
   * jatuh pada tanggal hari ini.
   */
  async generateMonthlyInvoiceForSubscription(subscription: Subscription): Promise<Invoice> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueDate = new Date(now);

    const item = this.itemRepo.create({
      description: `Langganan ${subscription.package.name} - ${periodStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      qty: 1,
      unitPrice: subscription.package.price,
      subtotal: subscription.package.price,
    });

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
      amount: subscription.package.price,
      taxAmount: 0,
      totalAmount: subscription.package.price,
      dueDate,
      status: "unpaid",
      items: [item],
    });

    const saved = await this.invoiceRepo.save(invoice);
    this.logger.log(`Invoice ${saved.invoiceNumber} dibuat untuk subscription ${subscription.id}`);
    return saved;
  }

  findAll(params: { customerId?: string; status?: string }) {
    const qb = this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .leftJoinAndSelect("subscription.customer", "customer")
      .leftJoinAndSelect("subscription.package", "package")
      .leftJoinAndSelect("invoice.items", "items")
      .orderBy("invoice.createdAt", "DESC");

    if (params.status) qb.andWhere("invoice.status = :status", { status: params.status });
    if (params.customerId) qb.andWhere("customer.id = :customerId", { customerId: params.customerId });

    return qb.getMany();
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ["subscription", "subscription.customer", "subscription.package", "items", "payments"],
    });
    if (!invoice) throw new NotFoundException("Invoice tidak ditemukan");
    return invoice;
  }

  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = "paid";
    invoice.paidAt = new Date();
    return this.invoiceRepo.save(invoice);
  }

  // Digunakan oleh isolir scheduler untuk mencari tagihan yang sudah lewat jatuh tempo
  async findOverdue(graceDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - graceDays);

    return this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.subscription", "subscription")
      .where("invoice.status = :status", { status: "unpaid" })
      .andWhere("invoice.dueDate <= :cutoff", { cutoff })
      .getMany();
  }

  // Menandai invoice unpaid yang lewat jatuh tempo sebagai overdue (dijalankan harian)
  async markOverdueInvoices() {
    const today = new Date();
    const result = await this.invoiceRepo
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: "overdue" })
      .where("status = :status", { status: "unpaid" })
      .andWhere("dueDate < :today", { today })
      .execute();
    return result.affected ?? 0;
  }

  // Ringkasan untuk dashboard/report
  async getSummary() {
    const [unpaidCount, overdueCount, paidThisMonth] = await Promise.all([
      this.invoiceRepo.count({ where: { status: "unpaid" } }),
      this.invoiceRepo.count({ where: { status: "overdue" } }),
      this.invoiceRepo
        .createQueryBuilder("invoice")
        .select("COALESCE(SUM(invoice.totalAmount), 0)", "total")
        .where("invoice.status = :status", { status: "paid" })
        .andWhere("EXTRACT(MONTH FROM invoice.paidAt) = EXTRACT(MONTH FROM CURRENT_DATE)")
        .andWhere("EXTRACT(YEAR FROM invoice.paidAt) = EXTRACT(YEAR FROM CURRENT_DATE)")
        .getRawOne(),
    ]);

    return {
      unpaidCount,
      overdueCount,
      revenueThisMonth: Number(paidThisMonth?.total ?? 0),
    };
  }
}
