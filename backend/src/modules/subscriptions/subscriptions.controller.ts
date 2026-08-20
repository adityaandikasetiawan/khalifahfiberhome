import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("subscriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @Roles("super_admin", "finance", "cs")
  create(@Body() dto: CreateSubscriptionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query("customerId") customerId?: string) {
    return this.service.findAll(customerId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @Roles("super_admin", "finance", "cs")
  update(@Param("id") id: string, @Body() dto: Partial<CreateSubscriptionDto>) {
    return this.service.update(id, dto);
  }

  @Patch(":id/suspend")
  @Roles("super_admin", "finance", "technician")
  suspend(@Param("id") id: string) {
    return this.service.suspend(id);
  }

  @Patch(":id/activate")
  @Roles("super_admin", "finance", "technician")
  activate(@Param("id") id: string) {
    return this.service.activate(id);
  }
}
