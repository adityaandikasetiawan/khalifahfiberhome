import { IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PayInvoiceDto {
  @ApiProperty({ example: "va", enum: ["va", "qris", "ewallet"] })
  @IsIn(["va", "qris", "ewallet"])
  paymentMethod: "va" | "qris" | "ewallet";
}
