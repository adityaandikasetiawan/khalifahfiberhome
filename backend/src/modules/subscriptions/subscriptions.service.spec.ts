import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { Subscription } from "./entities/subscription.entity";

/**
 * Test difokuskan pada findActiveDueToday -- ini adalah query yang dipakai
 * InvoiceGeneratorJob setiap hari untuk menentukan subscription mana yang
 * harus di-generate invoice-nya. Kalau where clause di sini salah (mis. lupa
 * filter status), bisa menagih pelanggan yang sudah suspended/cancelled.
 */
describe("SubscriptionsService", () => {
  let service: SubscriptionsService;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve(data)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionsService, { provide: getRepositoryToken(Subscription), useValue: mockRepo }],
    }).compile();
    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe("findActiveDueToday", () => {
    it("HANYA query subscription dengan status active -- subscription suspended/cancelled tidak boleh ikut ditagih", async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findActiveDueToday(15);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { status: "active", billingDay: 15 },
        relations: ["package", "customer"],
      });
    });
  });

  describe("suspend / activate", () => {
    it("suspend mengubah status subscription jadi suspended", async () => {
      mockRepo.findOne.mockResolvedValue({ id: "sub-1", status: "active" });
      await service.suspend("sub-1");
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: "suspended" }));
    });

    it("activate mengubah status subscription jadi active", async () => {
      mockRepo.findOne.mockResolvedValue({ id: "sub-1", status: "suspended" });
      await service.activate("sub-1");
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }));
    });

    it("melempar NotFoundException kalau subscription tidak ada -- mencegah crash tak jelas di isolir processor", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.suspend("sub-tidak-ada")).rejects.toThrow(NotFoundException);
    });
  });
});
