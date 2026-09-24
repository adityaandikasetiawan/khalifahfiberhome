import { IsEmail, IsOptional, IsString, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCustomerDto {
  @ApiPropertyOptional({ example: "CUST-00123", description: "Opsional. Jika kosong, akan di-generate otomatis (CUST-XXXXX)." })
  @IsOptional()
  @IsString()
  customerNumber?: string;

  @ApiProperty({ example: "Budi Santoso" })
  @IsString()
  name: string;

  @ApiProperty({ example: "081234567890" })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: "budi@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "Jl. Merdeka No. 10, Jakarta" })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: "2026-01-15" })
  @IsOptional()
  @IsDateString()
  installationDate?: string;
}
