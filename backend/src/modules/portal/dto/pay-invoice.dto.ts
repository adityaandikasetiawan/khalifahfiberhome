import { IsIn, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PayInvoiceDto {
  @ApiProperty({ example: "qris", enum: ["va", "qris", "ewallet"] })
  @IsIn(["va", "qris", "ewallet"])
  paymentMethod: "va" | "qris" | "ewallet";

  @ApiPropertyOptional({ example: "bca", description: "Channel spesifik (bank untuk VA, provider untuk e-wallet)" })
  @IsOptional()
  @IsString()
  paymentChannel?: string;
}
