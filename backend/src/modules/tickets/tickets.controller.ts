import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { TicketsService } from "./tickets.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";

@ApiTags("Tickets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("tickets")
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Post()
  @Roles("super_admin", "cs", "technician")
  @ApiOperation({ summary: "Buat tiket gangguan baru" })
  create(@Body() dto: CreateTicketDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles("super_admin", "cs", "technician")
  @ApiOperation({ summary: "List tiket (filter: status, assignedTo, customerId)" })
  findAll(
    @Query("status") status?: string,
    @Query("assignedTo") assignedTo?: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.service.findAll({ status, assignedTo, customerId });
  }

  @Get("stats")
  @Roles("super_admin", "cs")
  @ApiOperation({ summary: "Statistik tiket per status" })
  getStats() {
    return this.service.getStats();
  }

  @Get(":id")
  @Roles("super_admin", "cs", "technician")
  @ApiOperation({ summary: "Detail tiket" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @Roles("super_admin", "cs")
  @ApiOperation({ summary: "Update tiket" })
  update(@Param("id") id: string, @Body() dto: UpdateTicketDto) {
    return this.service.update(id, dto);
  }

  @Patch(":id/assign")
  @Roles("super_admin", "cs")
  @ApiOperation({ summary: "Assign teknisi ke tiket" })
  assignTechnician(@Param("id") id: string, @Body("technicianId") technicianId: string) {
    return this.service.assignTechnician(id, technicianId);
  }

  @Patch(":id/resolve")
  @Roles("super_admin", "technician")
  @ApiOperation({ summary: "Selesaikan tiket (resolve)" })
  resolve(@Param("id") id: string, @Body("notes") notes: string) {
    return this.service.resolve(id, notes);
  }
}
