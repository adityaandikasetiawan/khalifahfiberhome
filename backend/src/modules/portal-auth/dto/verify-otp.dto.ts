import { IsString, Length, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyOtpDto {
  @ApiProperty({
    example: "081234567890",
    description: "Nomor telepon. Terima format 08xxx, 62xxx, atau +62xxx.",
  })
  @IsString()
  @Matches(/^(\+?62|0)\d{8,13}$/, {
    message: "Format nomor tidak valid. Gunakan 08xxx, 62xxx, atau +62xxx.",
  })
  phone: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Kode OTP harus 6 digit" })
  otp: string;
}
