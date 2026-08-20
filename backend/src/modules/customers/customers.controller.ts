import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("customers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("customers")
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @Roles("super_admin", "finance", "cs")
  @ApiOperation({ summary: "Tambah pelanggan baru" })
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List pelanggan (support search & filter status)" })
  findAll(@Query("search") search?: string, @Query("status") status?: string) {
    return this.service.findAll(search, status);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detail pelanggan beserta subscription" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @Roles("super_admin", "finance", "cs")
  @ApiOperation({ summary: "Update data pelanggan" })
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("super_admin", "finance")
  @ApiOperation({ summary: "Nonaktifkan pelanggan (soft terminate)" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
