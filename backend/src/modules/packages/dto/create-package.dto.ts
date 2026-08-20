import { IsString, IsInt, IsNumber, IsEnum, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePackageDto {
  @ApiProperty({ example: "Home 20Mbps" })
  @IsString()
  name: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  speedMbps: number;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: "monthly", enum: ["monthly", "quarterly", "yearly"] })
  @IsEnum(["monthly", "quarterly", "yearly"])
  billingCycle: "monthly" | "quarterly" | "yearly";
}
