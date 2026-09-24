import { IsString, IsUUID, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApproveRegistrationDto {
  @ApiProperty({ description: "ID router MikroTik yang akan mengelola koneksi" })
  @IsUUID()
  routerId: string;

  @ApiProperty({ example: "rumah41", description: "Username PPPoE untuk pelanggan ini" })
  @IsString()
  pppoeUsername: string;

  @ApiPropertyOptional({ description: "Password PPPoE (default = username jika kosong)" })
  @IsOptional()
  @IsString()
  pppoePassword?: string;

  @ApiPropertyOptional({ example: "10M/10M", description: "Nama profile PPPoE di router" })
  @IsOptional()
  @IsString()
  mikrotikProfile?: string;

  @ApiPropertyOptional({ description: "Wajibkan invoice registrasi sudah lunas sebelum approve (default true)" })
  @IsOptional()
  @IsBoolean()
  requirePaid?: boolean;
}
