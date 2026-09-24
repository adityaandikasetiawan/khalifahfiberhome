import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { Subscription } from "./entities/subscription.entity";
import { Package } from "../packages/entities/package.entity";
import { MikrotikService } from "../mikrotik/mikrotik.service";

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
  const mockPackageRepo = { findOne: jest.fn() };
  const mockMikrotikService = { changeProfile: jest.fn(), createPppoeAccount: jest.fn(), activatePppoe: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(Subscription), useValue: mockRepo },
        { provide: getRepositoryToken(Package), useValue: mockPackageRepo },
        { provide: MikrotikService, useValue: mockMikrotikService },
      ],
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

  describe("update - ganti paket memicu changeProfile di router", () => {
    it("ganti paket subscription aktif -> changeProfile ke profile paket baru", async () => {
      mockRepo.findOne.mockResolvedValue({
        id: "sub-1",
        status: "active",
        packageId: "pkg-lama",
        routerId: "router-1",
        pppoeUsername: "rumah1",
      });
      mockPackageRepo.findOne.mockResolvedValue({ id: "pkg-baru", mikrotikProfile: "20M/20M" });
      mockMikrotikService.changeProfile.mockResolvedValue(true);

      await service.update("sub-1", { packageId: "pkg-baru" } as any);

      expect(mockMikrotikService.changeProfile).toHaveBeenCalledWith("router-1", "rumah1", "20M/20M");
    });

    it("update tanpa ganti paket TIDAK memanggil changeProfile", async () => {
      mockRepo.findOne.mockResolvedValue({
        id: "sub-2",
        status: "active",
        packageId: "pkg-lama",
        routerId: "router-1",
        pppoeUsername: "rumah2",
      });

      await service.update("sub-2", { billingDay: 10 } as any);

      expect(mockMikrotikService.changeProfile).not.toHaveBeenCalled();
    });
  });
});
