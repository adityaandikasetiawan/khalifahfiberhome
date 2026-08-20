import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  /**
   * Dipakai untuk mengisi dropdown "assign ke teknisi" di halaman tugas isolir.
   */
  async findByRole(role: User["role"]): Promise<User[]> {
    return this.usersRepo.find({ where: { role, isActive: true }, order: { name: "ASC" } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: "DESC" } });
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User tidak ditemukan");
    user.isActive = false;
    return this.usersRepo.save(user);
  }

  async create(params: { email: string; password: string; name: string; role?: User["role"] }): Promise<User> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new ConflictException("Email sudah terdaftar");
    }
    const hashed = await bcrypt.hash(params.password, 10);
    const user = this.usersRepo.create({ ...params, password: hashed });
    return this.usersRepo.save(user);
  }
}
