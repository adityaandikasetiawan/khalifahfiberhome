import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Package } from "./entities/package.entity";
import { CreatePackageDto } from "./dto/create-package.dto";
import { UpdatePackageDto } from "./dto/update-package.dto";

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package) private readonly repo: Repository<Package>,
  ) {}

  create(dto: CreatePackageDto) {
    const pkg = this.repo.create(dto);
    return this.repo.save(pkg);
  }

  async update(id: string, dto: UpdatePackageDto) {
    const pkg = await this.findOne(id);
    Object.assign(pkg, dto);
    return this.repo.save(pkg);
  }

  findAll(activeOnly = false) {
    return this.repo.find({ where: activeOnly ? { isActive: true } : {}, order: { price: "ASC" } });
  }

  async findOne(id: string): Promise<Package> {
    const pkg = await this.repo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException("Paket tidak ditemukan");
    return pkg;
  }

  async deactivate(id: string) {
    const pkg = await this.findOne(id);
    pkg.isActive = false;
    return this.repo.save(pkg);
  }
}
