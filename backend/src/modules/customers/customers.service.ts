import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Customer } from "./entities/customer.entity";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.repo.findOne({ where: { customerNumber: dto.customerNumber } });
    if (existing) throw new ConflictException("Nomor pelanggan sudah digunakan");
    const customer = this.repo.create(dto);
    return this.repo.save(customer);
  }

  async findAll(search?: string, status?: string) {
    const where: any = {};
    if (search) where.name = ILike(`%${search}%`);
    if (status) where.status = status;
    return this.repo.find({ where, order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id }, relations: ["subscriptions"] });
    if (!customer) throw new NotFoundException("Pelanggan tidak ditemukan");
    return customer;
  }

  /**
   * Dipakai oleh portal-auth (login OTP WhatsApp) untuk mencari pelanggan
   * berdasarkan nomor telepon terdaftar.
   */
  async findByPhone(phone: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    customer.status = "terminated";
    await this.repo.save(customer);
  }
}
