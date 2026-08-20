import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

function stripPassword(user: any) {
  const { password, ...rest } = user;
  return rest;
}

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles("super_admin", "finance", "cs")
  @ApiOperation({ summary: "List user internal, filter by role (mis. ?role=technician untuk dropdown assignment)" })
  async findAll(@Query("role") role?: "super_admin" | "finance" | "cs" | "technician") {
    if (!role) return [];
    const users = await this.usersService.findByRole(role);
    // Jangan pernah kirim password hash ke client
    return users.map(stripPassword);
  }

  @Get("manage")
  @Roles("super_admin")
  @ApiOperation({ summary: "List SEMUA user internal (untuk halaman manajemen user, khusus super_admin)" })
  async findAllForManagement() {
    const users = await this.usersService.findAll();
    return users.map(stripPassword);
  }

  @Post()
  @Roles("super_admin")
  @ApiOperation({ summary: "Buat user internal baru (admin/finance/cs/technician) -- khusus super_admin" })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return stripPassword(user);
  }

  @Patch(":id/deactivate")
  @Roles("super_admin")
  @ApiOperation({ summary: "Nonaktifkan user internal -- khusus super_admin" })
  async deactivate(@Param("id") id: string) {
    const user = await this.usersService.deactivate(id);
    return stripPassword(user);
  }
}
