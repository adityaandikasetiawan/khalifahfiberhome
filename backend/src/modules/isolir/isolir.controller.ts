import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { IsolirService } from "./isolir.service";
import { AssignTaskDto } from "./dto/assign-task.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("isolir")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("isolir-tasks")
export class IsolirController {
  constructor(private readonly service: IsolirService) {}

  @Get()
  @ApiOperation({ summary: "Daftar tugas isolir/aktivasi untuk teknisi" })
  findTasks(@Query("status") status?: string, @Query("assignedTo") assignedTo?: string) {
    return this.service.findTasks(status, assignedTo);
  }

  @Patch(":id/assign")
  @Roles("super_admin", "finance", "cs")
  @ApiOperation({ summary: "Assign tugas isolir/aktivasi ke teknisi tertentu (sebelum dikerjakan)" })
  assignTask(@Param("id") id: string, @Body() dto: AssignTaskDto) {
    return this.service.assignTask(id, dto.technicianId);
  }

  @Patch(":id/complete")
  @Roles("super_admin", "technician")
  @ApiOperation({ summary: "Tandai tugas isolir/aktivasi selesai dikerjakan teknisi" })
  completeTask(@Param("id") id: string, @Req() req: any) {
    return this.service.completeTask(id, req.user?.userId ?? "unknown");
  }

  @Get("subscription/:subscriptionId/history")
  @ApiOperation({ summary: "Riwayat isolir/aktivasi untuk sebuah subscription" })
  getHistory(@Param("subscriptionId") subscriptionId: string) {
    return this.service.getHistory(subscriptionId);
  }
}
