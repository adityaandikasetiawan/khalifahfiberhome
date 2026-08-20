import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Guard khusus portal pelanggan -- memakai strategy "customer-jwt"
 * (lihat customer-jwt.strategy.ts), terpisah dari JwtAuthGuard admin.
 */
@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard("customer-jwt") {}
