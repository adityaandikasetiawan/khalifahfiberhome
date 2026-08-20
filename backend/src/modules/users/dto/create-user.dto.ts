import { IsEmail, IsString, MinLength, IsIn, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "teknisi1@ispbilling.local" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "PasswordAman123!" })
  @IsString()
  @MinLength(8, { message: "Password minimal 8 karakter" })
  password: string;

  @ApiProperty({ example: "Budi Teknisi" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "technician", enum: ["super_admin", "finance", "cs", "technician"] })
  @IsOptional()
  @IsIn(["super_admin", "finance", "cs", "technician"])
  role?: "super_admin" | "finance" | "cs" | "technician";
}
