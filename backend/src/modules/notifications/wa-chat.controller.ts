import { Controller, Get, Post, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { WaChatService } from "./wa-chat.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

class SendChatDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

@ApiTags("whatsapp-chat")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "finance", "technician")
@Controller("whatsapp/chat")
export class WaChatController {
  constructor(private readonly service: WaChatService) {}

  @Get("conversations")
  @ApiOperation({ summary: "Daftar percakapan WhatsApp (1 baris per nomor)" })
  conversations() {
    return this.service.listConversations();
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Jumlah pesan WA belum dibaca" })
  async unread() {
    return { count: await this.service.unreadCount() };
  }

  @Get(":phone")
  @ApiOperation({ summary: "Histori percakapan 1 nomor + tandai sudah dibaca" })
  conversation(@Param("phone") phone: string, @Query("limit") limit?: string) {
    return this.service.getConversation(phone, limit ? Number(limit) : undefined);
  }

  @Post("send")
  @ApiOperation({ summary: "Kirim pesan WA (teks + gambar opsional) ke nomor" })
  send(@Body() dto: SendChatDto) {
    return this.service.sendChat(dto.phone, dto.body ?? "", dto.imageUrl);
  }
}
