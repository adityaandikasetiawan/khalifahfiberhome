import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { NotificationsService } from "./notifications.service";
import { NotificationLog } from "./entities/notification-log.entity";
import { SiteSetting } from "../site-settings/entities/site-setting.entity";
import { WhatsAppService } from "./whatsapp.service";
import { EmailService } from "./email.service";

/**
 * Test perilaku pengiriman notifikasi, fokus pada ketahanan WhatsApp (S1).
 *
 * Kontrak yang dikunci (mencegah notifikasi hilang diam-diam / komplain):
 *  1. WA sukses  => dicatat status "sent".
 *  2. WA gagal SEMENTARA (gateway belum siap) => error di-RE-THROW supaya
 *     BullMQ me-retry job (tidak dicatat "failed" permanen).
 *  3. WA gagal PERMANEN (nomor tak terdaftar) => dicatat "failed", TIDAK di-retry.
 *  4. Kegagalan WA tidak menghalangi pengiriman email (channel independen).
 */
describe("NotificationsService - ketahanan WhatsApp", () => {
  let service: NotificationsService;

  const mockRepo = {
    findOne: jest.fn().mockResolvedValue(null), // alreadySent => false
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve(d)),
  };
  const mockSettingRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const mockWhatsApp = { sendMessage: jest.fn() };
  const mockEmail = { isConfigured: jest.fn().mockReturnValue(false), sendEmail: jest.fn() };
  const mockConfig = { get: jest.fn().mockReturnValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.findOne.mockResolvedValue(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(NotificationLog), useValue: mockRepo },
        { provide: getRepositoryToken(SiteSetting), useValue: mockSettingRepo },
        { provide: WhatsAppService, useValue: mockWhatsApp },
        { provide: EmailService, useValue: mockEmail },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
    jest.spyOn((service as any).logger, "error").mockImplementation(() => undefined);
    jest.spyOn((service as any).logger, "log").mockImplementation(() => undefined);
  });

  const baseParams = {
    customerId: "cust-1",
    invoiceId: "inv-1",
    phone: "628123456789",
    type: "invoice_created" as any,
    context: { customerName: "A", invoiceNumber: "INV-1", amount: "200.000", dueDate: "01/10/2026", paymentLink: "x" },
  };

  it("mencatat 'sent' saat WA berhasil", async () => {
    mockWhatsApp.sendMessage.mockResolvedValue(undefined);
    await service.sendAndLog(baseParams);
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "whatsapp", status: "sent" }),
    );
  });

  describe("sendAdminPaymentAlert", () => {
    it("mengirim WA ke nomor admin (dinormalkan ke 62) dengan detail pembayaran", async () => {
      mockWhatsApp.sendMessage.mockResolvedValue(undefined);
      await service.sendAdminPaymentAlert({
        adminNumbers: "+62811580929",
        amount: 200000,
        invoiceNumber: "INV-1",
        customerName: "Budi",
        customerNumber: "KHA-010",
      });
      expect(mockWhatsApp.sendMessage).toHaveBeenCalledTimes(1);
      const [num, msg] = mockWhatsApp.sendMessage.mock.calls[0];
      expect(num).toBe("62811580929");
      expect(msg).toMatch(/Pembayaran Masuk/);
      expect(msg).toMatch(/Budi/);
      expect(msg).toMatch(/200\.000/);
    });

    it("mendukung beberapa nomor admin (pisah koma)", async () => {
      mockWhatsApp.sendMessage.mockResolvedValue(undefined);
      await service.sendAdminPaymentAlert({ adminNumbers: "081111,62822", amount: 100000 });
      expect(mockWhatsApp.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockWhatsApp.sendMessage.mock.calls[0][0]).toBe("6281111");
      expect(mockWhatsApp.sendMessage.mock.calls[1][0]).toBe("62822");
    });

    it("tidak kirim apa pun kalau ADMIN_WA_NUMBER kosong", async () => {
      await service.sendAdminPaymentAlert({ adminNumbers: "", amount: 100000 });
      expect(mockWhatsApp.sendMessage).not.toHaveBeenCalled();
    });
  });

  it("RE-THROW saat WA gateway belum siap (agar job di-retry BullMQ)", async () => {
    mockWhatsApp.sendMessage.mockRejectedValue(
      new Error("WhatsApp gateway belum siap (status: initializing). Scan QR di admin panel terlebih dahulu."),
    );
    await expect(service.sendAndLog(baseParams)).rejects.toThrow(/belum siap/);
    // tidak mencatat failed permanen untuk kasus sementara
    expect(mockRepo.save).not.toHaveBeenCalledWith(
      expect.objectContaining({ channel: "whatsapp", status: "failed" }),
    );
  });

  it("mencatat 'failed' (tanpa re-throw) saat nomor tidak terdaftar", async () => {
    mockWhatsApp.sendMessage.mockRejectedValue(new Error("Nomor 628123456789 tidak terdaftar di WhatsApp."));
    await service.sendAndLog(baseParams); // tidak throw
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "whatsapp", status: "failed" }),
    );
  });
});
