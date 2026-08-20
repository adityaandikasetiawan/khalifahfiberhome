import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1784528403102 implements MigrationInterface {
    name = 'InitSchema1784528403102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'finance', 'cs', 'technician')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'cs', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."customers_status_enum" AS ENUM('active', 'suspended', 'terminated')`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerNumber" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying, "address" text NOT NULL, "installationDate" date, "status" "public"."customers_status_enum" NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ac2fd5d477df162f3f6246c7284" UNIQUE ("customerNumber"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."packages_billingcycle_enum" AS ENUM('monthly', 'quarterly', 'yearly')`);
        await queryRunner.query(`CREATE TABLE "packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "speedMbps" integer NOT NULL, "price" numeric(12,2) NOT NULL, "billingCycle" "public"."packages_billingcycle_enum" NOT NULL DEFAULT 'monthly', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_id" uuid NOT NULL, "description" character varying NOT NULL, "qty" integer NOT NULL DEFAULT '1', "unitPrice" numeric(12,2) NOT NULL, "subtotal" numeric(12,2) NOT NULL, CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('bank_transfer', 'va', 'ewallet', 'cash', 'qris')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'success', 'failed', 'expired')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_id" uuid NOT NULL, "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL, "gatewayReference" character varying, "amount" numeric(12,2) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "paidAt" TIMESTAMP, "rawPayload" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9d4d9f469b7236cc5ad3d4050ca" UNIQUE ("gatewayReference"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")); COMMENT ON COLUMN "payments"."rawPayload" IS 'Raw webhook payload untuk audit'`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('draft', 'unpaid', 'paid', 'overdue', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying NOT NULL, "subscription_id" uuid NOT NULL, "periodStart" date NOT NULL, "periodEnd" date NOT NULL, "amount" numeric(12,2) NOT NULL DEFAULT '0', "taxAmount" numeric(12,2) NOT NULL DEFAULT '0', "totalAmount" numeric(12,2) NOT NULL DEFAULT '0', "dueDate" date NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'unpaid', "paidAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'suspended', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" uuid NOT NULL, "package_id" uuid NOT NULL, "startDate" date NOT NULL, "billingDay" integer NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "mikrotikProfile" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscriptions"."billingDay" IS 'Tanggal jatuh tempo tiap bulan, 1-28'; COMMENT ON COLUMN "subscriptions"."mikrotikProfile" IS 'Mapping ke profile PPPoE/Mikrotik (fase otomasi lanjutan)'`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_channel_enum" AS ENUM('whatsapp', 'email', 'sms')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_type_enum" AS ENUM('invoice_created', 'reminder_h3', 'reminder_h1', 'overdue', 'isolir', 'payment_success')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('sent', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" character varying NOT NULL, "invoice_id" character varying, "channel" "public"."notification_logs_channel_enum" NOT NULL, "type" "public"."notification_logs_type_enum" NOT NULL, "status" "public"."notification_logs_status_enum" NOT NULL, "errorMessage" text, "sentAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_19c524e644cdeaebfcffc284871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."suspension_logs_action_enum" AS ENUM('suspend', 'activate')`);
        await queryRunner.query(`CREATE TYPE "public"."suspension_logs_triggeredby_enum" AS ENUM('system', 'admin')`);
        await queryRunner.query(`CREATE TABLE "suspension_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_id" character varying NOT NULL, "action" "public"."suspension_logs_action_enum" NOT NULL, "reason" text, "triggeredBy" "public"."suspension_logs_triggeredby_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc4c5b08d50a870a50ca56a3a47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."network_tasks_type_enum" AS ENUM('suspend', 'activate')`);
        await queryRunner.query(`CREATE TYPE "public"."network_tasks_status_enum" AS ENUM('pending', 'in_progress', 'done', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "network_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_id" character varying NOT NULL, "invoice_id" character varying, "type" "public"."network_tasks_type_enum" NOT NULL, "status" "public"."network_tasks_status_enum" NOT NULL DEFAULT 'pending', "assignedTo" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7b386fe4d9125e9188753e89b1b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_dc991d555664682cfe892eea2c1" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_563a5e248518c623eebd987d43e" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_98a4e1e3025f768de1493ecedec" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_ed655e6276526f4f1b8167ff6be" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_ed655e6276526f4f1b8167ff6be"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_98a4e1e3025f768de1493ecedec"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_563a5e248518c623eebd987d43e"`);
        await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_dc991d555664682cfe892eea2c1"`);
        await queryRunner.query(`DROP TABLE "network_tasks"`);
        await queryRunner.query(`DROP TYPE "public"."network_tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."network_tasks_type_enum"`);
        await queryRunner.query(`DROP TABLE "suspension_logs"`);
        await queryRunner.query(`DROP TYPE "public"."suspension_logs_triggeredby_enum"`);
        await queryRunner.query(`DROP TYPE "public"."suspension_logs_action_enum"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_channel_enum"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`DROP TABLE "invoice_items"`);
        await queryRunner.query(`DROP TABLE "packages"`);
        await queryRunner.query(`DROP TYPE "public"."packages_billingcycle_enum"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TYPE "public"."customers_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
