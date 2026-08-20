import { PartialType } from "@nestjs/swagger";
import { IsOptional, IsEnum, IsString, IsUUID } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { CreateTicketDto } from "./create-ticket.dto";
import { TicketStatus } from "../entities/ticket.entity";

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({ enum: ["open", "in_progress", "resolved", "closed"] })
  @IsOptional()
  @IsEnum(["open", "in_progress", "resolved", "closed"] as any)
  status?: TicketStatus;

  @ApiPropertyOptional({ example: "technician-user-uuid" })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ example: "Kabel FO putus, sudah disambung ulang." })
  @IsOptional()
  @IsString()
  notes?: string;
}
