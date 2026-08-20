import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignTaskDto {
  @ApiProperty({ description: "ID user dengan role technician" })
  @IsUUID()
  technicianId: string;
}
