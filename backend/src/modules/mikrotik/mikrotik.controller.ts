import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { MikrotikService } from "./mikrotik.service";
import { MikrotikImportService } from "./mikrotik-import.service";
import { CreateRouterDto } from "./dto/create-router.dto";
import { UpdateRouterDto } from "./dto/update-router.dto";

@ApiTags("MikroTik Routers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
@Controller("routers")
export class MikrotikController {
  constructor(
    private readonly mikrotikService: MikrotikService,
    private readonly importService: MikrotikImportService,
  ) {}

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
    return this.mikrotikService.findOneMasked(id);
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

  @Get("profiles/all")
  @ApiOperation({ summary: "Gabungan nama profile PPPoE dari semua router aktif (untuk dropdown paket)" })
  @Roles("super_admin", "technician", "finance")
  getAllProfiles() {
    return this.mikrotikService.getAllProfileNames();
  }

  @Get(":id/profiles")
  @ApiOperation({ summary: "Ambil daftar PPPoE profiles di router" })
  @Roles("super_admin", "technician", "finance")
  getProfiles(@Param("id") id: string) {
    return this.mikrotikService.getProfiles(id);
  }

  @Post(":id/profiles")
  @ApiOperation({ summary: "Tambah profile PPPoE baru di router (tidak menghapus yang ada)" })
  @Roles("super_admin", "technician")
  createProfile(
    @Param("id") id: string,
    @Body() body: { name: string; rateLimit?: string; localAddress?: string; remoteAddress?: string },
  ) {
    return this.mikrotikService.createProfile(id, body.name, body.rateLimit, body.localAddress, body.remoteAddress);
  }

  @Get(":id/active-connections")
  @ApiOperation({ summary: "Ambil daftar koneksi PPPoE aktif di router" })
  @Roles("super_admin", "technician")
  getActiveConnections(@Param("id") id: string) {
    return this.mikrotikService.getActiveConnections(id);
  }

  @Post(":id/import-pppoe")
  @ApiOperation({
    summary: "Import/sync akun PPPoE dari router menjadi pelanggan + subscription di billing",
  })
  importPppoe(@Param("id") id: string) {
    return this.importService.importFromRouter(id);
  }
}
