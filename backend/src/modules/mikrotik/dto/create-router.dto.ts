import { IsString, IsInt, IsBoolean, IsOptional, Min, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateRouterDto {
  @ApiProperty({ example: "RB-Cluster-01" })
  @IsString()
  name: string;

  @ApiProperty({ example: "192.168.88.1" })
  @IsString()
  host: string;

  @ApiPropertyOptional({ example: 8728 })
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number = 8728;

  @ApiProperty({ example: "admin" })
  @IsString()
  username: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  password: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  useTls?: boolean = false;

  @ApiPropertyOptional({ example: "Router utama area Selatan" })
  @IsString()
  @IsOptional()
  notes?: string;
}
