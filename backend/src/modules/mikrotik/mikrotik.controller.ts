import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { MikrotikService } from "./mikrotik.service";
import { CreateRouterDto } from "./dto/create-router.dto";
import { UpdateRouterDto } from "./dto/update-router.dto";

@ApiTags("MikroTik Routers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
@Controller("routers")
export class MikrotikController {
  constructor(private readonly mikrotikService: MikrotikService) {}

  @Post()
  @ApiOperation({ summary: "Tambah router MikroTik baru" })
  create(@Body() dto: CreateRouterDto) {
    return this.mikrotikService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Daftar semua router" })
  @Roles("super_admin", "technician")
  findAll() {
    return this.mikrotikService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Detail router" })
  findOne(@Param("id") id: string) {
    return this.mikrotikService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update router" })
  update(@Param("id") id: string, @Body() dto: UpdateRouterDto) {
    return this.mikrotikService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Nonaktifkan router" })
  remove(@Param("id") id: string) {
    return this.mikrotikService.remove(id);
  }

  @Post(":id/test")
  @ApiOperation({ summary: "Test koneksi ke router" })
  testConnection(@Param("id") id: string) {
    return this.mikrotikService.testConnection(id);
  }

  @Get(":id/profiles")
  @ApiOperation({ summary: "Ambil daftar PPPoE profiles di router" })
  @Roles("super_admin", "technician")
  getProfiles(@Param("id") id: string) {
    return this.mikrotikService.getProfiles(id);
  }

  @Get(":id/active-connections")
  @ApiOperation({ summary: "Ambil daftar koneksi PPPoE aktif di router" })
  @Roles("super_admin", "technician")
  getActiveConnections(@Param("id") id: string) {
    return this.mikrotikService.getActiveConnections(id);
  }
}
