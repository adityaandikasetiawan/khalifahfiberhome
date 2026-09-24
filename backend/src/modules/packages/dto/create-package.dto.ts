import { IsString, IsInt, IsNumber, IsEnum, Min, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePackageDto {
  @ApiProperty({ example: "Home 20Mbps" })
  @IsString()
  name: string;

  @ApiProperty({ example: 20, description: "Kecepatan asli (rate-limit teknis)" })
  @IsInt()
  @Min(1)
  speedMbps: number;

  @ApiPropertyOptional({ example: 30, description: "Kecepatan tampil ke pelanggan (up to X Mbps). Kosong = pakai speedMbps." })
  @IsOptional()
  @IsInt()
  @Min(1)
  displaySpeedMbps?: number;

  @ApiPropertyOptional({ example: "Cocok untuk beberapa perangkat", description: "Deskripsi tampil ke pelanggan sebagai pengganti kecepatan." })
  @IsOptional()
  @IsString()
  displayDesc?: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: "monthly", enum: ["monthly", "quarterly", "yearly"] })
  @IsEnum(["monthly", "quarterly", "yearly"])
  billingCycle: "monthly" | "quarterly" | "yearly";

  @ApiPropertyOptional({ example: "10M/10M", description: "Nama profile PPPoE di router" })
  @IsOptional()
  @IsString()
  mikrotikProfile?: string;
}
