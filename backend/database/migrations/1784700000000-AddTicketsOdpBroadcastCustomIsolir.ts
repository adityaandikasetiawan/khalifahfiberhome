import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketsOdpBroadcastCustomIsolir1784700000000 implements MigrationInterface {
  name = "AddTicketsOdpBroadcastCustomIsolir1784700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(`CREATE TYPE "ticket_status_enum" AS ENUM ('open', 'in_progress', 'resolved', 'closed')`);
    await queryRunner.query(`CREATE TYPE "ticket_priority_enum" AS ENUM ('low', 'medium', 'high')`);
    await queryRunner.query(`CREATE TYPE "broadcast_target_type_enum" AS ENUM ('all', 'router', 'loket')`);
    await queryRunner.query(`CREATE TYPE "broadcast_status_enum" AS ENUM ('draft', 'sending', 'sent')`);

    // Tabel tickets
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customerId" character varying NOT NULL,
        "subject" character varying NOT NULL,
        "description" text NOT NULL,
        "photoUrl" character varying,
        "status" "ticket_status_enum" NOT NULL DEFAULT 'open',
        "priority" "ticket_priority_enum" NOT NULL DEFAULT 'medium',
        "assignedTo" character varying,
        "resolvedAt" TIMESTAMP,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tickets_id" PRIMARY KEY ("id")
      )
    `);

    // Tabel odp
    await queryRunner.query(`
      CREATE TABLE "odp" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "totalPorts" integer NOT NULL,
        "usedPorts" integer NOT NULL DEFAULT 0,
        "latitude" numeric,
        "longitude" numeric,
        "photoUrl" character varying,
        "routerId" character varying,
        "technicianId" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_odp_id" PRIMARY KEY ("id")
      )
    `);

    // Tabel broadcast
    await queryRunner.query(`
      CREATE TABLE "broadcast" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "targetType" "broadcast_target_type_enum" NOT NULL DEFAULT 'all',
        "targetRouterId" character varying,
        "sentCount" integer NOT NULL DEFAULT 0,
        "failedCount" integer NOT NULL DEFAULT 0,
        "status" "broadcast_status_enum" NOT NULL DEFAULT 'draft',
        "sentAt" TIMESTAMP,
        "createdBy" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broadcast_id" PRIMARY KEY ("id")
      )
    `);

    // Custom isolir fields pada subscriptions
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD "isolirMode" character varying NOT NULL DEFAULT 'auto_invoice'`);
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD "isolirDayOffset" integer NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback isolir fields
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "isolirDayOffset"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "isolirMode"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "broadcast"`);
    await queryRunner.query(`DROP TABLE "odp"`);
    await queryRunner.query(`DROP TABLE "tickets"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "broadcast_status_enum"`);
    await queryRunner.query(`DROP TYPE "broadcast_target_type_enum"`);
    await queryRunner.query(`DROP TYPE "ticket_priority_enum"`);
    await queryRunner.query(`DROP TYPE "ticket_status_enum"`);
  }
}
