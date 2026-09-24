import { IsUUID, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePaymentTransactionDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ example: "qris", enum: ["va", "qris", "ewallet"] })
  @IsEnum(["va", "qris", "ewallet"])
  paymentMethod: "va" | "qris" | "ewallet";

  @ApiPropertyOptional({
    example: "bca",
    description: "Channel spesifik. VA: bca/bni/bri/mandiri/cimb/permata. E-wallet: ovo/dana/shopeepay/linkaja",
  })
  @IsOptional()
  @IsString()
  paymentChannel?: string;
}
