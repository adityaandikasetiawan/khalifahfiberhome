import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Odp } from "./entities/odp.entity";
import { CreateOdpDto } from "./dto/create-odp.dto";
import { UpdateOdpDto } from "./dto/update-odp.dto";

@Injectable()
export class OdpService {
  constructor(
    @InjectRepository(Odp) private readonly repo: Repository<Odp>,
  ) {}

  async create(dto: CreateOdpDto): Promise<Odp> {
    const odp = this.repo.create(dto);
    return this.repo.save(odp);
  }

  async findAll(routerId?: string) {
    const where: any = {};
    if (routerId) where.routerId = routerId;
    return this.repo.find({ where, order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<Odp> {
    const odp = await this.repo.findOne({ where: { id } });
    if (!odp) throw new NotFoundException("ODP tidak ditemukan");
    return odp;
  }

  async update(id: string, dto: UpdateOdpDto): Promise<Odp> {
    const odp = await this.findOne(id);
    Object.assign(odp, dto);
    return this.repo.save(odp);
  }

  async remove(id: string): Promise<void> {
    const odp = await this.findOne(id);
    await this.repo.remove(odp);
  }

  async incrementUsedPorts(id: string): Promise<Odp> {
    const odp = await this.findOne(id);
    if (odp.usedPorts >= odp.totalPorts) {
      throw new BadRequestException("Semua port ODP sudah terpakai");
    }
    odp.usedPorts += 1;
    return this.repo.save(odp);
  }

  async decrementUsedPorts(id: string): Promise<Odp> {
    const odp = await this.findOne(id);
    if (odp.usedPorts <= 0) {
      throw new BadRequestException("Port ODP sudah 0, tidak bisa dikurangi");
    }
    odp.usedPorts -= 1;
    return this.repo.save(odp);
  }
}
