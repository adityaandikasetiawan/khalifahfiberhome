import { PartialType } from "@nestjs/swagger";
import { CreateOdpDto } from "./create-odp.dto";

export class UpdateOdpDto extends PartialType(CreateOdpDto) {}
