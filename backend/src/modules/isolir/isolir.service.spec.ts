import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { IsolirService } from "./isolir.service";
import { SuspensionLog } from "./entities/suspension-log.entity";
import { NetworkTask } from "./entities/network-task.entity";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { UsersService } from "../users/users.service";

describe("IsolirService", () => {
  let service: IsolirService;

  const mockLogRepo = { save: jest.fn((d) => Promise.resolve(d)), create: jest.fn((d) => d), find: jest.fn() };
  const mockTaskRepo = {
    findOne: jest.fn(),
    save: jest.fn((d) => Promise.resolve({ id: "task-1", ...d })),
    create: jest.fn((d) => d),
  };
  const mockSubscriptionsService = { suspend: jest.fn(), activate: jest.fn() };
  const mockUsersService = { findById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsolirService,
        { provide: getRepositoryToken(SuspensionLog), useValue: mockLogRepo },
        { provide: getRepositoryToken(NetworkTask), useValue: mockTaskRepo },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();
    service = module.get<IsolirService>(IsolirService);
  });

  describe("createSuspendTask", () => {
    it("TIDAK membuat tugas duplikat kalau sudah ada tugas suspend pending untuk subscription yang sama", async () => {
      const existingTask = { id: "existing-task", status: "pending" };
      mockTaskRepo.findOne.mockResolvedValue(existingTask);

      const result = await service.createSuspendTask("sub-1", "inv-1", "Overdue 3 hari");

      expect(result).toBe(existingTask);
      expect(mockTaskRepo.save).not.toHaveBeenCalled();
    });

    it("membuat tugas baru kalau belum ada tugas suspend pending", async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);
      await service.createSuspendTask("sub-2", "inv-2", "Overdue 3 hari");
      expect(mockTaskRepo.save).toHaveBeenCalled();
      expect(mockLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: "suspend", triggeredBy: "system" }),
      );
    });
  });

  describe("assignTask", () => {
    it("MENOLAK assign kalau user yang dipilih bukan role technician (mis. salah pilih finance)", async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: "task-1", status: "pending" });
      mockUsersService.findById.mockResolvedValue({ id: "user-1", role: "finance" });

      await expect(service.assignTask("task-1", "user-1")).rejects.toThrow(BadRequestException);
    });

    it("MENOLAK assign ke user yang tidak ditemukan", async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: "task-1", status: "pending" });
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.assignTask("task-1", "user-tidak-ada")).rejects.toThrow(BadRequestException);
    });

    it("MENOLAK assign ulang tugas yang sudah done/cancelled", async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: "task-1", status: "done" });
      await expect(service.assignTask("task-1", "user-1")).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findById).not.toHaveBeenCalled();
    });

    it("berhasil assign ke teknisi valid, status berubah jadi in_progress", async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: "task-1", status: "pending" });
      mockUsersService.findById.mockResolvedValue({ id: "tech-1", role: "technician" });

      const result = await service.assignTask("task-1", "tech-1");
      expect(result.status).toBe("in_progress");
      expect(result.assignedTo).toBe("tech-1");
    });
  });

  describe("completeTask", () => {
    it("tugas type=suspend -> memanggil subscriptionsService.suspend (BUKAN activate)", async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: "task-1", type: "suspend", subscriptionId: "sub-1" });
      await service.completeTask("task-1", "tech-1");
      expect(mockSubscriptionsService.suspend).toHaveBeenCalledWith("sub-1");
      expect(mockSubscriptionsService.activate).not.toHaveBeenCalled();
    });

    it("tugas type=activate -> memanggil subscriptionsService.activate (BUKAN suspend)", async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: "task-2", type: "activate", subscriptionId: "sub-2" });
      await service.completeTask("task-2", "tech-1");
      expect(mockSubscriptionsService.activate).toHaveBeenCalledWith("sub-2");
      expect(mockSubscriptionsService.suspend).not.toHaveBeenCalled();
    });

    it("melempar NotFoundException kalau task tidak ada", async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);
      await expect(service.completeTask("task-tidak-ada", "tech-1")).rejects.toThrow(NotFoundException);
    });
  });
});
