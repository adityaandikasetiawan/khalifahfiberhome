import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Data source khusus untuk TypeORM CLI (migration:generate, migration:run,
 * migration:revert). Terpisah dari database.config.ts yang dipakai NestJS
 * runtime, karena CLI membutuhkan format konfigurasi yang sedikit berbeda
 * (entities/migrations sebagai glob path, bukan autoLoadEntities).
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "isp_billing",
  entities: [__dirname + "/../modules/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../../database/migrations/*{.ts,.js}"],
  synchronize: false,
  logging: false,
});
