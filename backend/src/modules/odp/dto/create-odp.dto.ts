import { IsString, IsOptional, IsInt, IsNumber, IsUUID, IsUrl, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOdpDto {
  @ApiProperty({ example: "ODP-JKT-001" })
  @IsString()
  name: string;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  totalPorts: number;

  @ApiPropertyOptional({ example: -6.2088 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 106.8456 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: "https://storage.example.com/odp-photo.jpg" })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({ example: "router-uuid" })
  @IsOptional()
  @IsUUID()
  routerId?: string;

  @ApiPropertyOptional({ example: "technician-uuid" })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({ example: "Lokasi di tiang depan rumah Pak RT" })
  @IsOptional()
  @IsString()
  notes?: string;
}
