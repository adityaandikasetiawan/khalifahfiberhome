import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Ticket } from "./entities/ticket.entity";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly repo: Repository<Ticket>,
  ) {}

  async create(dto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.repo.create(dto);
    return this.repo.save(ticket);
  }

  async findAll(filters: { status?: string; assignedTo?: string; customerId?: string } = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.customerId) where.customerId = filters.customerId;
    return this.repo.find({ where, order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException("Ticket tidak ditemukan");
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    Object.assign(ticket, dto);
    return this.repo.save(ticket);
  }

  async assignTechnician(id: string, technicianId: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    ticket.assignedTo = technicianId;
    ticket.status = "in_progress";
    return this.repo.save(ticket);
  }

  async resolve(id: string, notes: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    ticket.status = "resolved";
    ticket.resolvedAt = new Date();
    ticket.notes = notes;
    return this.repo.save(ticket);
  }

  async getStats() {
    const result = await this.repo
      .createQueryBuilder("ticket")
      .select("ticket.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("ticket.status")
      .getRawMany();
    return result;
  }
}
