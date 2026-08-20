import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { BroadcastService } from "./broadcast.service";
import { CreateBroadcastDto } from "./dto/create-broadcast.dto";

@ApiTags("Broadcast")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "finance")
@Controller("broadcast")
export class BroadcastController {
  constructor(private readonly service: BroadcastService) {}

  @Post()
  @ApiOperation({ summary: "Buat broadcast baru (draft)" })
  create(@Body() dto: CreateBroadcastDto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "List semua broadcast" })
  findAll() {
    return this.service.findAll();
  }

  @Get("history")
  @ApiOperation({ summary: "Riwayat broadcast yang sudah dikirim" })
  getHistory() {
    return this.service.getHistory();
  }

  @Get(":id")
  @ApiOperation({ summary: "Detail broadcast" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post(":id/send")
  @ApiOperation({ summary: "Kirim broadcast (trigger pengiriman)" })
  send(@Param("id") id: string) {
    return this.service.send(id);
  }
}
