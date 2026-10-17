import { IsEmail, IsOptional, IsString, IsDateString, IsIn, ValidateIf } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CustomerStatus } from "../entities/customer.entity";

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

  // Email opsional. Terima string kosong ("") dari form admin tanpa menolak:
  // validasi @IsEmail hanya dijalankan bila nilainya terisi (bukan "" / null).
  @ApiPropertyOptional({ example: "budi@example.com" })
  @IsOptional()
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== "")
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "Jl. Merdeka No. 10, Jakarta" })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: "2026-01-15" })
  @IsOptional()
  @IsDateString()
  installationDate?: string;

  // Status pelanggan. Dikirim oleh form edit admin; divalidasi terhadap enum.
  @ApiPropertyOptional({ enum: ["active", "suspended", "terminated", "pending_verification", "pending_active"] })
  @IsOptional()
  @IsIn(["active", "suspended", "terminated", "pending_verification", "pending_active"])
  status?: CustomerStatus;
}
