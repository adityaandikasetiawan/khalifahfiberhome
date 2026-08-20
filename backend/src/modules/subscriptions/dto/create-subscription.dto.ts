import { IsUUID, IsInt, Min, Max, IsDateString, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  packageId: string;

  @ApiProperty({ example: "2026-08-01" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: 15, description: "Tanggal jatuh tempo tiap bulan (1-28)" })
  @IsInt()
  @Min(1)
  @Max(28)
  billingDay: number;

  @ApiPropertyOptional({ example: "pppoe-profile-20mbps" })
  @IsOptional()
  @IsString()
  mikrotikProfile?: string;

  @ApiPropertyOptional({ example: "pppoe-budi001", description: "Username PPPoE di MikroTik" })
  @IsOptional()
  @IsString()
  pppoeUsername?: string;

  @ApiPropertyOptional({ description: "ID router MikroTik yang mengelola koneksi ini" })
  @IsOptional()
  @IsUUID()
  routerId?: string;
}
