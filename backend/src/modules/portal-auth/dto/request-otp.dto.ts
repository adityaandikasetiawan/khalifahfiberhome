import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestOtpDto {
  @ApiProperty({
    example: "081234567890",
    description: "Nomor telepon terdaftar. Terima format 08xxx, 62xxx, atau +62xxx.",
  })
  @IsString()
  @Matches(/^(\+?62|0)\d{8,13}$/, {
    message: "Format nomor tidak valid. Gunakan 08xxx, 62xxx, atau +62xxx.",
  })
  phone: string;
}
