import { IsString, IsOptional, IsEmail, IsUUID, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "Budi Santoso" })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiPropertyOptional({ example: "3201xxxxxxxxxxxx" })
  @IsOptional()
  @IsString()
  nik?: string;

  @ApiProperty({ example: "081234567890" })
  @IsString()
  phone: string;

  @ApiProperty({ example: "budi@example.com", description: "Wajib untuk verifikasi email" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Jl. Merdeka No. 10" })
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kelurahan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kecamatan?: string;

  @ApiProperty({ description: "ID paket yang dipilih" })
  @IsUUID()
  packageId: string;

  @ApiProperty({ example: "rahasia123", description: "Password untuk login portal (min 6 karakter)" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
