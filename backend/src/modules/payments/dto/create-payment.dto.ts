import { IsUUID, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentTransactionDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ example: "va", enum: ["va", "qris", "ewallet"] })
  @IsEnum(["va", "qris", "ewallet"])
  paymentMethod: "va" | "qris" | "ewallet";
}
