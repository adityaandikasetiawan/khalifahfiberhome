import { IsString, Length, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyOtpDto {
  @ApiProperty({ example: "6281234567890" })
  @IsString()
  @Matches(/^62\d{8,13}$/, { message: "Nomor telepon harus format 62xxx (contoh: 6281234567890)" })
  phone: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Kode OTP harus 6 digit" })
  otp: string;
}
