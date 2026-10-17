import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { getQueueToken } from "@nestjs/bullmq";
import { InvoicesService } from "./invoices.service";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Subscription } from "../subscriptions/entities/subscription.entity";

// Queue notifikasi (dipakai create() untuk enqueue invoice_created). Mock no-op.
const mockNotificationsQueue = { add: jest.fn() };

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
        { provide: getQueueToken("notifications"), useValue: mockNotificationsQueue },
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

/**
 * Mengunci model masa aktif baru: saat invoice DIBAYAR (markAsPaid), masa aktif
 * dihitung ULANG = tanggal bayar s/d tanggal bayar + 1 BULAN KALENDER
 * (bukan +30 hari, bukan akhir bulan). Termasuk kasus overflow akhir bulan
 * (31 Jan -> 28/29 Feb, 30 Jan -> 28/29 Feb).
 */
describe("InvoicesService - markAsPaid menghitung masa aktif = paidAt + 1 bulan kalender", () => {
  let service: InvoicesService;
  let savedInvoice: any;

  const mockInvoiceRepo = {
    findOne: jest.fn(),
    save: jest.fn((data) => Promise.resolve(data)),
    createQueryBuilder: jest.fn(),
  };
  const mockItemRepo = { create: jest.fn((data) => data) };
  const mockSubscriptionRepo = {};

  const buildService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(InvoiceItem), useValue: mockItemRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
        { provide: getQueueToken("notifications"), useValue: mockNotificationsQueue },
      ],
    }).compile();
    return module.get<InvoicesService>(InvoicesService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    savedInvoice = {
      id: "inv-pay-1",
      status: "unpaid",
      periodStart: new Date("2026-10-01T00:00:00"),
      periodEnd: new Date("2026-10-31T00:00:00"),
      // findOne di markAsPaid butuh relasi; cukup objek minimal
      subscription: { id: "sub-1", customer: { id: "cust-1" } },
      items: [],
      payments: [],
    };
    mockInvoiceRepo.findOne.mockResolvedValue(savedInvoice);
    mockInvoiceRepo.save.mockImplementation((data) => Promise.resolve(data));
    service = await buildService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("bayar 10 Okt -> masa aktif s/d 10 Nov (tanggal sama bulan berikutnya)", async () => {
    jest.setSystemTime(new Date("2026-10-10T09:30:00"));

    const result = await service.markAsPaid("inv-pay-1");

    expect(result.status).toBe("paid");
    expect(result.paidAt).toBeInstanceOf(Date);
    // periodStart = tanggal bayar
    expect(result.periodStart.getFullYear()).toBe(2026);
    expect(result.periodStart.getMonth()).toBe(9); // Oktober (0-indexed)
    expect(result.periodStart.getDate()).toBe(10);
    // periodEnd = + 1 bulan kalender -> 10 Nov
    expect(result.periodEnd.getFullYear()).toBe(2026);
    expect(result.periodEnd.getMonth()).toBe(10); // November
    expect(result.periodEnd.getDate()).toBe(10);
  });

  it("bayar 31 Jan -> clamp ke 28 Feb (tahun non-kabisat)", async () => {
    jest.setSystemTime(new Date("2026-01-31T12:00:00")); // 2026 bukan kabisat

    const result = await service.markAsPaid("inv-pay-1");

    expect(result.periodStart.getMonth()).toBe(0); // Januari
    expect(result.periodStart.getDate()).toBe(31);
    expect(result.periodEnd.getMonth()).toBe(1); // Februari
    expect(result.periodEnd.getDate()).toBe(28); // clamp, bukan meluber ke Maret
  });

  it("bayar 31 Jan -> clamp ke 29 Feb (tahun kabisat)", async () => {
    jest.setSystemTime(new Date("2028-01-31T12:00:00")); // 2028 kabisat

    const result = await service.markAsPaid("inv-pay-1");

    expect(result.periodEnd.getMonth()).toBe(1); // Februari
    expect(result.periodEnd.getDate()).toBe(29); // 2028 kabisat
  });

  it("bayar 30 Jan -> clamp ke 28 Feb (tahun non-kabisat)", async () => {
    jest.setSystemTime(new Date("2026-01-30T08:00:00"));

    const result = await service.markAsPaid("inv-pay-1");

    expect(result.periodEnd.getMonth()).toBe(1); // Februari
    expect(result.periodEnd.getDate()).toBe(28);
  });
});
