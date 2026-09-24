import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginPasswordDto {
  @ApiProperty({ example: "pelanggan@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "rahasia123" })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RequestResetDto {
  @ApiProperty({ example: "pelanggan@example.com" })
  @IsEmail()
  email: string;
}

export class SetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: "rahasia123" })
  @IsString()
  @MinLength(6)
  password: string;
}
