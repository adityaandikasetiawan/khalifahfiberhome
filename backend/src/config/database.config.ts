import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: "postgres",
  host: config.get("DB_HOST", "localhost"),
  port: parseInt(config.get("DB_PORT", "5432"), 10),
  username: config.get("DB_USERNAME", "postgres"),
  password: config.get("DB_PASSWORD", "postgres"),
  database: config.get("DB_NAME", "isp_billing"),
  autoLoadEntities: true,
  // Schema dikelola lewat migration (lihat database/migrations & npm run migration:*).
  // Jangan aktifkan synchronize di sini -- migration adalah satu-satunya sumber
  // kebenaran skema agar tim (Odi/Ipan) tidak bentrok skema lokal.
  synchronize: false,
  logging: config.get("NODE_ENV") === "development",
});
