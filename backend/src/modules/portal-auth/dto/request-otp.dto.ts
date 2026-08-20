import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestOtpDto {
  @ApiProperty({ example: "6281234567890", description: "Nomor telepon terdaftar (format 62xxx, tanpa +/spasi)" })
  @IsString()
  @Matches(/^62\d{8,13}$/, { message: "Nomor telepon harus format 62xxx (contoh: 6281234567890)" })
  phone: string;
}
