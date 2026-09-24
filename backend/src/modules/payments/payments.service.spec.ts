import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { getQueueToken } from "@nestjs/bullmq";
import { NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentsService } from "./payments.service";
import { Payment } from "./entities/payment.entity";
import { InvoicesService } from "../invoices/invoices.service";
import { MidtransProvider } from "./gateways/midtrans.provider";
import { IpaymuProvider } from "./gateways/ipaymu.provider";

/**
 * Test ini fokus pada bagian PALING KRITIS di seluruh sistem: idempotency
 * webhook payment. Payment gateway (Midtrans/Xendit) BISA mengirim webhook
 * yang sama lebih dari sekali (retry saat timeout, dsb) -- jika logic ini
 * salah, pelanggan bisa "dobel bayar" tercatat, atau invoice yang sudah
 * lunas malah ditimpa status pending lagi.
 */
describe("PaymentsService - webhook idempotency", () => {
  let service: PaymentsService;

  const mockPaymentRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
    find: jest.fn(),
  };

  const mockInvoicesService = {
    findOne: jest.fn(),
    markAsPaid: jest.fn(),
  };

  const mockNotificationsQueue = { add: jest.fn() };
  const mockIsolirQueue = { add: jest.fn() };
  const mockMidtransProvider = { createTransaction: jest.fn(), verifySignature: jest.fn() };
  const mockIpaymuProvider = { createTransaction: jest.fn(), checkTransaction: jest.fn(), verifyCallback: jest.fn() };
  // get() default mengembalikan undefined -- artinya PAYMENT_PROVIDER tidak
  // di-set ke "mock", jadi test ini menguji jalur gateway sungguhan (seperti production)
  const mockConfigService = { get: jest.fn().mockReturnValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: InvoicesService, useValue: mockInvoicesService },
        { provide: MidtransProvider, useValue: mockMidtransProvider },
        { provide: IpaymuProvider, useValue: mockIpaymuProvider },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getQueueToken("notifications"), useValue: mockNotificationsQueue },
        { provide: getQueueToken("isolir"), useValue: mockIsolirQueue },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it("memproses webhook sukses pertama kali dengan normal: update status & tandai invoice lunas", async () => {
    const payment = { id: "pay-1", invoiceId: "inv-1", status: "pending" };
    mockPaymentRepo.findOne.mockResolvedValue(payment);
    mockPaymentRepo.save.mockImplementation((p) => Promise.resolve(p));
    mockInvoicesService.markAsPaid.mockResolvedValue({
      id: "inv-1",
      subscription: { id: "sub-1", status: "active", customer: { id: "cust-1" } },
      subscriptionId: "sub-1",
    });

    const result = await service.handleWebhook({
      gatewayReference: "ORDER-1",
      status: "success",
      rawPayload: { order_id: "ORDER-1" },
    });

    expect(result.status).toBe("success");
    expect(mockInvoicesService.markAsPaid).toHaveBeenCalledTimes(1);
    expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
      "payment_success",
      expect.objectContaining({ invoiceId: "inv-1" }),
    );
  });

  it("MENGABAIKAN webhook duplikat -- payment yang statusnya sudah success tidak diproses ulang", async () => {
    const alreadySuccessPayment = { id: "pay-1", invoiceId: "inv-1", status: "success" };
    mockPaymentRepo.findOne.mockResolvedValue(alreadySuccessPayment);

    const result = await service.handleWebhook({
      gatewayReference: "ORDER-1",
      status: "success",
      rawPayload: { order_id: "ORDER-1" },
    });

    // Invoice TIDAK boleh di-markAsPaid lagi, dan TIDAK ada notifikasi kedua terkirim
    expect(mockInvoicesService.markAsPaid).not.toHaveBeenCalled();
    expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
    expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    expect(result).toBe(alreadySuccessPayment);
  });

  it("menolak webhook dengan gatewayReference yang tidak dikenal", async () => {
    mockPaymentRepo.findOne.mockResolvedValue(null);

    await expect(
      service.handleWebhook({
        gatewayReference: "ORDER-TIDAK-ADA",
        status: "success",
        rawPayload: {},
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("membuat tugas aktivasi otomatis jika subscription sedang suspended saat pembayaran sukses", async () => {
    const payment = { id: "pay-2", invoiceId: "inv-2", status: "pending" };
    mockPaymentRepo.findOne.mockResolvedValue(payment);
    mockPaymentRepo.save.mockImplementation((p) => Promise.resolve(p));
    mockInvoicesService.markAsPaid.mockResolvedValue({
      id: "inv-2",
      subscriptionId: "sub-2",
      subscription: { id: "sub-2", status: "suspended", customer: { id: "cust-2" } },
    });

    await service.handleWebhook({
      gatewayReference: "ORDER-2",
      status: "success",
      rawPayload: {},
    });

    expect(mockIsolirQueue.add).toHaveBeenCalledWith(
      "activate",
      expect.objectContaining({ subscriptionId: "sub-2", invoiceId: "inv-2" }),
      expect.objectContaining({ attempts: expect.any(Number) }),
    );
  });

  it("TIDAK membuat tugas aktivasi jika subscription memang masih aktif (bukan hasil isolir)", async () => {
    const payment = { id: "pay-3", invoiceId: "inv-3", status: "pending" };
    mockPaymentRepo.findOne.mockResolvedValue(payment);
    mockPaymentRepo.save.mockImplementation((p) => Promise.resolve(p));
    mockInvoicesService.markAsPaid.mockResolvedValue({
      id: "inv-3",
      subscriptionId: "sub-3",
      subscription: { id: "sub-3", status: "active", customer: { id: "cust-3" } },
    });

    await service.handleWebhook({ gatewayReference: "ORDER-3", status: "success", rawPayload: {} });

    expect(mockIsolirQueue.add).not.toHaveBeenCalled();
  });

  it("payment gagal (failed/expired) tidak menandai invoice lunas", async () => {
    const payment = { id: "pay-4", invoiceId: "inv-4", status: "pending" };
    mockPaymentRepo.findOne.mockResolvedValue(payment);
    mockPaymentRepo.save.mockImplementation((p) => Promise.resolve(p));

    await service.handleWebhook({ gatewayReference: "ORDER-4", status: "expired", rawPayload: {} });

    expect(mockInvoicesService.markAsPaid).not.toHaveBeenCalled();
  });

  it("createTransaction: kalau gateway gagal dihubungi, payment ditandai failed & error jelas dilempar (bukan pending menggantung)", async () => {
    mockInvoicesService.findOne.mockResolvedValue({
      id: "inv-5",
      invoiceNumber: "INV-202607-0005",
      totalAmount: 100000,
      status: "unpaid",
      subscription: { customer: { name: "Test Customer" } },
    });
    let savedPayment: any;
    mockPaymentRepo.create.mockImplementation((data) => ({ ...data, id: "pay-5" }));
    mockPaymentRepo.save.mockImplementation((p) => {
      savedPayment = p;
      return Promise.resolve(p);
    });
    mockMidtransProvider.createTransaction.mockRejectedValue(new Error("Network timeout"));

    await expect(
      service.createTransaction({ invoiceId: "inv-5", paymentMethod: "va" }),
    ).rejects.toThrow("Tidak bisa terhubung ke payment gateway");

    expect(savedPayment.status).toBe("failed");
  });

  it("createTransaction: mode mock (PAYMENT_PROVIDER=mock) tidak pernah memanggil gateway asli", async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === "PAYMENT_PROVIDER" ? "mock" : undefined,
    );
    mockInvoicesService.findOne.mockResolvedValue({
      id: "inv-6",
      invoiceNumber: "INV-202607-0006",
      totalAmount: 50000,
      status: "unpaid",
      subscription: { customer: { name: "Test Customer" } },
    });
    mockPaymentRepo.create.mockImplementation((data) => ({ ...data, id: "pay-6" }));
    mockPaymentRepo.save.mockImplementation((p) => Promise.resolve(p));

    const result = await service.createTransaction({ invoiceId: "inv-6", paymentMethod: "qris" });

    expect(mockMidtransProvider.createTransaction).not.toHaveBeenCalled();
    expect(result.gateway.mock).toBe(true);

    mockConfigService.get.mockReturnValue(undefined); // reset untuk test lain
  });
});
