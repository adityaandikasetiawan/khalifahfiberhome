import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { CustomersService } from "../../customers/customers.service";

/**
 * Strategy JWT terpisah dari admin (lihat modules/auth/strategies/jwt.strategy.ts).
 * Menggunakan secret yang SAMA (JWT_SECRET) tapi memvalidasi payload.type === "customer"
 * agar token portal pelanggan tidak bisa dipakai untuk mengakses endpoint admin
 * dan sebaliknya, walau secret-nya identik.
 */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, "customer-jwt") {
  constructor(
    private readonly config: ConfigService,
    private readonly customersService: CustomersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; phone: string; type: string }) {
    if (payload.type !== "customer") {
      throw new UnauthorizedException("Token tidak valid untuk portal pelanggan");
    }
    const customer = await this.customersService.findOne(payload.sub).catch(() => null);
    if (!customer || customer.status === "terminated") {
      throw new UnauthorizedException("Akun pelanggan tidak ditemukan atau sudah tidak aktif");
    }
    return { customerId: customer.id, phone: customer.phone, name: customer.name };
  }
}
