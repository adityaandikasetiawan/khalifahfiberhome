import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OdpService } from "./odp.service";
import { CreateOdpDto } from "./dto/create-odp.dto";
import { UpdateOdpDto } from "./dto/update-odp.dto";

@ApiTags("ODP")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("odp")
export class OdpController {
  constructor(private readonly service: OdpService) {}

  @Post()
  @Roles("super_admin")
  @ApiOperation({ summary: "Tambah ODP baru" })
  create(@Body() dto: CreateOdpDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles("super_admin", "technician")
  @ApiOperation({ summary: "List semua ODP (filter: routerId)" })
  findAll(@Query("routerId") routerId?: string) {
    return this.service.findAll(routerId);
  }

  @Get(":id")
  @Roles("super_admin", "technician")
  @ApiOperation({ summary: "Detail ODP" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @Roles("super_admin")
  @ApiOperation({ summary: "Update ODP" })
  update(@Param("id") id: string, @Body() dto: UpdateOdpDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("super_admin")
  @ApiOperation({ summary: "Hapus ODP" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
