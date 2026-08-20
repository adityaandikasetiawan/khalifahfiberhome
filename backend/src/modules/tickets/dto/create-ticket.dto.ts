import { IsString, IsOptional, IsUUID, IsEnum, IsUrl } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketPriority } from "../entities/ticket.entity";

export class CreateTicketDto {
  @ApiProperty({ example: "Internet mati total" })
  @IsString()
  subject: string;

  @ApiProperty({ example: "Sejak tadi pagi internet mati, lampu LOS menyala merah." })
  @IsString()
  description: string;

  @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ enum: ["low", "medium", "high"], default: "medium" })
  @IsOptional()
  @IsEnum(["low", "medium", "high"] as any)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: "https://storage.example.com/foto-gangguan.jpg" })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
