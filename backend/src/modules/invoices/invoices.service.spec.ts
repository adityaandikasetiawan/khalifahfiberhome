import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { InvoicesService } from "./invoices.service";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";

/**
 * Test alur inti generate invoice bulanan otomatis (dipanggil oleh
 * InvoiceGeneratorJob setiap hari). Memverifikasi angka & status yang
 * dihasilkan benar sebelum invoice dikirim ke pelanggan.
 */
describe("InvoicesService - generateMonthlyInvoiceForSubscription", () => {
  let service: InvoicesService;

  // createQueryBuilder dipakai guard anti-duplikat; default getOne()=null (belum ada invoice periode ini)
  const mockQB = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  };
  const mockInvoiceRepo = {
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ ...data, id: "invoice-generated-1" })),
    createQueryBuilder: jest.fn(() => mockQB),
  };
  const mockItemRepo = { create: jest.fn((data) => data) };
  const mockSubscriptionRepo = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    // restore chain query builder setelah clearAllMocks
    mockQB.where.mockReturnThis();
    mockQB.andWhere.mockReturnThis();
    mockQB.getOne.mockResolvedValue(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(InvoiceItem), useValue: mockItemRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
      ],
    }).compile();
    service = module.get<InvoicesService>(InvoicesService);
  });

  it("menghasilkan invoice dengan total sesuai harga paket, status unpaid, dan 1 item langganan", async () => {
    const subscription: any = {
      id: "sub-1",
      package: { name: "Home 20Mbps", price: 250000 },
    };

    const invoice = await service.generateMonthlyInvoiceForSubscription(subscription);

    expect(invoice.status).toBe("unpaid");
    expect(Number(invoice.totalAmount)).toBe(250000);
    expect(invoice.subscriptionId).toBe("sub-1");
    expect(invoice.items).toHaveLength(1);
    expect(Number(invoice.items[0].subtotal)).toBe(250000);
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{6}-\d{4}$/);
  });

  it("TIDAK membuat invoice ganda jika periode yang sama sudah ada (anti double-generate)", async () => {
    const existing = { id: "existing-inv", invoiceNumber: "INV-202610-0001" };
    mockQB.getOne.mockResolvedValue(existing); // sudah ada invoice periode ini

    const subscription: any = { id: "sub-1", package: { name: "Paket Standar", price: 250000 } };
    const invoice = await service.generateMonthlyInvoiceForSubscription(subscription);

    // kembalikan yang sudah ada, tidak menyimpan invoice baru
    expect(invoice).toBe(existing);
    expect(mockInvoiceRepo.save).not.toHaveBeenCalled();
  });
});
