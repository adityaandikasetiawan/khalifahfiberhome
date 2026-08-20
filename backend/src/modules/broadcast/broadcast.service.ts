import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Broadcast } from "./entities/broadcast.entity";
import { CreateBroadcastDto } from "./dto/create-broadcast.dto";

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(Broadcast) private readonly repo: Repository<Broadcast>,
    @InjectQueue("notifications") private readonly notificationsQueue: Queue,
  ) {}

  async create(dto: CreateBroadcastDto, userId: string): Promise<Broadcast> {
    const broadcast = this.repo.create({ ...dto, createdBy: userId });
    return this.repo.save(broadcast);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<Broadcast> {
    const broadcast = await this.repo.findOne({ where: { id } });
    if (!broadcast) throw new NotFoundException("Broadcast tidak ditemukan");
    return broadcast;
  }

  async send(id: string): Promise<Broadcast> {
    const broadcast = await this.findOne(id);
    if (broadcast.status !== "draft") {
      throw new BadRequestException("Broadcast sudah dikirim atau sedang dalam proses pengiriman");
    }
    broadcast.status = "sending";
    broadcast.sentAt = new Date();
    await this.repo.save(broadcast);

    // Queue notification job for async processing
    await this.notificationsQueue.add("broadcast", {
      broadcastId: broadcast.id,
      title: broadcast.title,
      message: broadcast.message,
      targetType: broadcast.targetType,
      targetRouterId: broadcast.targetRouterId,
    });

    return broadcast;
  }

  async getHistory() {
    return this.repo.find({
      where: [{ status: "sent" as const }, { status: "sending" as const }],
      order: { sentAt: "DESC" },
    });
  }
}
