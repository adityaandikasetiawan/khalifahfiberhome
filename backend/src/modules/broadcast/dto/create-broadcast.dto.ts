import { IsString, IsOptional, IsEnum, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BroadcastTargetType } from "../entities/broadcast.entity";

export class CreateBroadcastDto {
  @ApiProperty({ example: "Pemberitahuan Maintenance" })
  @IsString()
  title: string;

  @ApiProperty({ example: "Akan ada maintenance jaringan pada tanggal 20 Januari 2026 pukul 00:00-04:00 WIB." })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: "/uploads/hero/xxx.webp", description: "URL gambar lampiran (opsional)" })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: ["all", "router", "loket"], default: "all" })
  @IsOptional()
  @IsEnum(["all", "router", "loket"] as any)
  targetType?: BroadcastTargetType;

  @ApiPropertyOptional({ example: "router-uuid" })
  @IsOptional()
  @IsUUID()
  targetRouterId?: string;
}
