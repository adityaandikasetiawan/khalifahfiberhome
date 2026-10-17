import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { InvoiceGeneratorJob } from "./invoice-generator.job";
import { InvoicesService } from "./invoices.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

/**
 * Test untuk InvoiceGeneratorJob.
 *
 * Sejak model billing diubah menjadi "masa aktif = tanggal bayar + 1 bulan",
 * cron bulanan periode-kalender (handleDailyInvoiceGeneration) DINONAKTIFKAN
 * karena membuat invoice dobel dengan jalur renewal. Perpanjangan ditangani
 * oleh handleRenewalGeneration (H-3 sebelum masa aktif habis).
 *
 * Kontrak yang dikunci:
 *  1. handleDailyInvoiceGeneration TIDAK pernah membuat invoice / notifikasi
 *     (apa pun subscription yang jatuh tempo hari ini) -> cegah invoice hantu.
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

  it("handleDailyInvoiceGeneration DINONAKTIFKAN: tidak membuat invoice walau ada subscription jatuh tempo (cegah invoice hantu)", async () => {
    // Walaupun ada subscription yang 'jatuh tempo hari ini', cron ini tidak
    // boleh menagih apa pun karena perpanjangan ditangani cron renewal.
    mockSubscriptionsService.findActiveDueToday.mockResolvedValue([
      makeSub({ id: "due-1", startDate: daysFromNow(-30), customerId: "c1" }),
      makeSub({ id: "due-2", startDate: null, customerId: "c2" }),
    ]);

    await job.handleDailyInvoiceGeneration();

    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).not.toHaveBeenCalled();
    expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
  });

  it("handleDailyInvoiceGeneration tidak error walau tidak ada data (no-op aman)", async () => {
    await expect(job.handleDailyInvoiceGeneration()).resolves.toBeUndefined();
    expect(mockInvoicesService.generateMonthlyInvoiceForSubscription).not.toHaveBeenCalled();
  });
});
