import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "./entities/subscription.entity";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription) private readonly repo: Repository<Subscription>,
  ) {}

  create(dto: CreateSubscriptionDto) {
    const sub = this.repo.create(dto as any);
    return this.repo.save(sub);
  }

  findAll(customerId?: string) {
    return this.repo.find({
      where: customerId ? { customerId } : {},
      relations: ["package", "customer"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<Subscription> {
    const sub = await this.repo.findOne({ where: { id }, relations: ["package", "customer"] });
    if (!sub) throw new NotFoundException("Subscription tidak ditemukan");
    return sub;
  }

  async update(id: string, dto: Partial<CreateSubscriptionDto>) {
    const sub = await this.findOne(id);
    Object.assign(sub, dto);
    return this.repo.save(sub);
  }

  // Digunakan oleh invoice generator job untuk mencari subscription yang jatuh tempo hari ini
  findActiveDueToday(billingDay: number) {
    return this.repo.find({
      where: { status: "active", billingDay },
      relations: ["package", "customer"],
    });
  }

  async suspend(id: string) {
    const sub = await this.findOne(id);
    sub.status = "suspended";
    return this.repo.save(sub);
  }

  async activate(id: string) {
    const sub = await this.findOne(id);
    sub.status = "active";
    return this.repo.save(sub);
  }
}
