import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { InvoiceGeneratorJob } from "./invoice-generator.job";
import { InvoicesService } from "./invoices.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

/**
 * Test untuk InvoiceGeneratorJob.handleDailyInvoiceGeneration.
 *
 * Fokus: guard `startDate`. Ini area sensitif komplain pelanggan:
 *  - jika terlalu longgar -> pelanggan ditagih sebelum masa aktif (komplain "kok sudah ditagih?")
 *  - jika terlalu ketat  -> pelanggan yang seharusnya ditagih terlewat (kehilangan pendapatan)
 *
 * Kontrak yang dikunci:
 *  1. startDate di masa depan  => TIDAK generate invoice, TIDAK kirim notifikasi.
 *  2. startDate sudah lewat     => generate invoice + kirim notifikasi.
 *  3. startDate == hari ini     => tetap ditagih (batas pakai '>' bukan '>=').
 *  4. tanpa startDate           => ditagih (kompatibel data lama).
 *  5. error pada 1 subscription => tidak menghentikan proses subscription lain.
 */
describe("InvoiceGeneratorJob", () => {
  let job: InvoiceGeneratorJob;

  const mockSubscriptionsService = {
    findActiveDueToday: jest.fn(),
    findAllActive: jest.fn(),
  };
  const mockInvoicesService = {
    generateMonthlyInvoiceForSubscription: jest.fn(),
    markOverdueInvoices: jest.fn(),
    getActiveUntil: jest.fn(),
    generateRenewalInvoice: jest.fn(),
  };
  const mockNotificationsQueue = { add: jest.fn() };

  const makeSub = (over: Partial<any> = {}) => ({
    id: over.id ?? "sub-1",
    startDate: over.startDate ?? null,
    customer: { id: over.customerId ?? "cust-1" },
    package: { name: "Paket Hemat" },
    ...over,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceGeneratorJob,
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: InvoicesService, useValue: mockInvoicesService },
        { provide: getQueueToken("notifications"), useValue: mockNotificationsQueue },
      ],
    }).compile();

    job = module.get<InvoiceGeneratorJob>(InvoiceGeneratorJob);
    // Diamkan logger agar output test bersih
    jest.spyOn((job as any).logger, "log").mockImplementation(() => undefined);
    jest.spyOn((job as any).logger, "error").mockImplementation(() => undefined);
  });

  const daysFromNow = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  it("TIDAK menagih ketika startDate masih di masa depan", async () => {
    mockSubscriptionsService.findActiveDueToday.mockResolvedValue([
      makeSub({ id: "future", startDate: daysFromNow(7) }),
    ]);

    await job.handleDailyInvoiceGeneration();

    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).not.toHaveBeenCalled();
    expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
  });

  it("menagih + mengirim notifikasi ketika startDate sudah lewat", async () => {
    const sub = makeSub({ id: "past", startDate: daysFromNow(-30), customerId: "cust-past" });
    mockSubscriptionsService.findActiveDueToday.mockResolvedValue([sub]);
    mockInvoicesService.generateMonthlyInvoiceForSubscription.mockResolvedValue({ id: "inv-1" });

    await job.handleDailyInvoiceGeneration();

    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).toHaveBeenCalledWith(sub);
    expect(mockNotificationsQueue.add).toHaveBeenCalledWith("invoice_created", {
      customerId: "cust-past",
      invoiceId: "inv-1",
    });
  });

  it("menagih ketika startDate == hari ini (batas '>' bukan '>=')", async () => {
    const sub = makeSub({ id: "today", startDate: new Date() });
    mockSubscriptionsService.findActiveDueToday.mockResolvedValue([sub]);
    mockInvoicesService.generateMonthlyInvoiceForSubscription.mockResolvedValue({ id: "inv-today" });

    await job.handleDailyInvoiceGeneration();

    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).toHaveBeenCalledWith(sub);
    expect(mockNotificationsQueue.add).toHaveBeenCalledTimes(1);
  });

  it("menagih ketika subscription tidak punya startDate (kompatibel data lama)", async () => {
    const sub = makeSub({ id: "nostart", startDate: null });
    mockSubscriptionsService.findActiveDueToday.mockResolvedValue([sub]);
    mockInvoicesService.generateMonthlyInvoiceForSubscription.mockResolvedValue({ id: "inv-x" });

    await job.handleDailyInvoiceGeneration();

    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).toHaveBeenCalledWith(sub);
    expect(mockNotificationsQueue.add).toHaveBeenCalledTimes(1);
  });

  it("hanya menagih yang startDate-nya sudah tiba dari campuran (tidak ada yang kelewat, tidak ada yang dini)", async () => {
    const subFuture = makeSub({ id: "f", startDate: daysFromNow(5), customerId: "cf" });
    const subDue = makeSub({ id: "d", startDate: daysFromNow(-1), customerId: "cd" });
    mockSubscriptionsService.findActiveDueToday.mockResolvedValue([subFuture, subDue]);
    mockInvoicesService.generateMonthlyInvoiceForSubscription.mockResolvedValue({ id: "inv-d" });

    await job.handleDailyInvoiceGeneration();

    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).toHaveBeenCalledTimes(1);
    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).toHaveBeenCalledWith(subDue);
    expect(mockNotificationsQueue.add).toHaveBeenCalledWith("invoice_created", {
      customerId: "cd",
      invoiceId: "inv-d",
    });
  });

  it("error pada satu subscription tidak menghentikan penagihan subscription lain", async () => {
    const subA = makeSub({ id: "A", startDate: daysFromNow(-10), customerId: "ca" });
    const subB = makeSub({ id: "B", startDate: daysFromNow(-10), customerId: "cb" });
    mockSubscriptionsService.findActiveDueToday.mockResolvedValue([subA, subB]);
    mockInvoicesService.generateMonthlyInvoiceForSubscription
      .mockRejectedValueOnce(new Error("db error"))
      .mockResolvedValueOnce({ id: "inv-B" });

    await job.handleDailyInvoiceGeneration();

    // A gagal, B tetap diproses & dikirim
    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).toHaveBeenCalledTimes(2);
    expect(mockNotificationsQueue.add).toHaveBeenCalledTimes(1);
    expect(mockNotificationsQueue.add).toHaveBeenCalledWith("invoice_created", {
      customerId: "cb",
      invoiceId: "inv-B",
    });
  });
});
