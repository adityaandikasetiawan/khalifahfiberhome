import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMikrotikIntegration1784615000000 implements MigrationInterface {
  name = "AddMikrotikIntegration1784615000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabel routers untuk menyimpan daftar MikroTik
    await queryRunner.query(`
      CREATE TABLE "routers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "host" character varying NOT NULL,
        "port" integer NOT NULL DEFAULT 8728,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "useTls" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_routers_id" PRIMARY KEY ("id")
      )
    `);

    // Tambah kolom ke subscriptions untuk mapping PPPoE
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD "pppoeUsername" character varying`);
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD "routerId" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "routerId"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "pppoeUsername"`);
    await queryRunner.query(`DROP TABLE "routers"`);
  }
}
