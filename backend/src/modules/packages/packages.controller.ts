import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { PackagesService } from "./packages.service";
import { CreatePackageDto } from "./dto/create-package.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("packages")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("packages")
export class PackagesController {
  constructor(private readonly service: PackagesService) {}

  @Post()
  @Roles("super_admin", "finance")
  create(@Body() dto: CreatePackageDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query("activeOnly") activeOnly?: string) {
    return this.service.findAll(activeOnly === "true");
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Delete(":id")
  @Roles("super_admin", "finance")
  @ApiOperation({ summary: "Nonaktifkan paket (tidak dihapus, untuk menjaga histori invoice)" })
  deactivate(@Param("id") id: string) {
    return this.service.deactivate(id);
  }
}
