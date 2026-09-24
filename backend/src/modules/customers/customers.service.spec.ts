import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { getQueueToken } from "@nestjs/bullmq";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { Customer } from "./entities/customer.entity";
import { Invoice } from "../invoices/entities/invoice.entity";

describe("CustomersService", () => {
  let service: CustomersService;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: "cust-1", ...data })),
  };

  // Repo Invoice dipakai saat update kontak -> kirim invoice belum lunas.
  const mockInvoiceRepo = {
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };
  const mockNotificationsQueue = { add: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockRepo },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: getQueueToken("notifications"), useValue: mockNotificationsQueue },
      ],
    }).compile();
    service = module.get<CustomersService>(CustomersService);
  });

  describe("create", () => {
    it("berhasil membuat pelanggan baru kalau customerNumber belum dipakai", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.create({
        customerNumber: "CUST-99999",
        name: "Test",
        phone: "6281200000000",
        address: "Jl. Test",
      });
      expect(result.customerNumber).toBe("CUST-99999");
    });

    it("MENOLAK kalau customerNumber sudah dipakai pelanggan lain (mencegah data duplikat)", async () => {
      mockRepo.findOne.mockResolvedValue({ id: "existing-cust", customerNumber: "CUST-99999" });
      await expect(
        service.create({ customerNumber: "CUST-99999", name: "Test", phone: "628120000", address: "Jl. Test" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findOne", () => {
    it("melempar NotFoundException kalau pelanggan tidak ada -- endpoint lain (invoice, subscription) bergantung pada ini untuk gagal dengan jelas", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne("id-tidak-ada")).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("soft-delete: mengubah status jadi terminated, BUKAN menghapus baris dari database (menjaga histori invoice)", async () => {
      mockRepo.findOne.mockResolvedValue({ id: "cust-1", status: "active" });
      await service.remove("cust-1");
      const savedArg = mockRepo.save.mock.calls[0][0];
      expect(savedArg.status).toBe("terminated");
    });
  });

  describe("findByPhone", () => {
    it("dipakai oleh portal-auth untuk login OTP -- harus query exact match, bukan partial/ILike (mencegah OTP terkirim ke nomor yang salah)", async () => {
      mockRepo.findOne.mockResolvedValue({ id: "cust-1", phone: "6281234567890" });
      await service.findByPhone("6281234567890");
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { phone: "6281234567890" } });
    });
  });

  describe("update - auto kirim invoice saat kontak diisi", () => {
    it("kirim invoice belum lunas ketika email baru diisi (sebelumnya kosong)", async () => {
      mockRepo.findOne.mockResolvedValue({ id: "cust-1", email: null, phone: "", name: "Test" });
      // 1 invoice belum lunas ditemukan
      mockInvoiceRepo.createQueryBuilder.mockReturnValueOnce({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: "inv-1" }]),
      } as any);

      await service.update("cust-1", { email: "baru@example.com" } as any);

      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        "invoice_created",
        expect.objectContaining({ invoiceId: "inv-1", customerId: "cust-1" }),
      );
    });

    it("TIDAK kirim apa-apa kalau kontak tidak berubah", async () => {
      mockRepo.findOne.mockResolvedValue({ id: "cust-2", email: "lama@example.com", phone: "628111", name: "Test" });

      await service.update("cust-2", { name: "Nama Baru" } as any);

      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
    });
  });
});
