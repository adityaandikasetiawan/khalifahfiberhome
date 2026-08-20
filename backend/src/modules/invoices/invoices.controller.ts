import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("invoices")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  @Roles("super_admin", "finance")
  @ApiOperation({ summary: "Buat invoice manual (biaya instalasi/tambahan)" })
  create(@Body() dto: CreateInvoiceDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List invoice (filter by customerId & status)" })
  findAll(@Query("customerId") customerId?: string, @Query("status") status?: string) {
    return this.service.findAll({ customerId, status });
  }

  @Get("summary")
  @ApiOperation({ summary: "Ringkasan invoice untuk dashboard" })
  getSummary() {
    return this.service.getSummary();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id/mark-paid")
  @Roles("super_admin", "finance")
  @ApiOperation({ summary: "Tandai invoice lunas secara manual (mis. pembayaran cash/transfer manual)" })
  markAsPaid(@Param("id") id: string) {
    return this.service.markAsPaid(id);
  }
}
