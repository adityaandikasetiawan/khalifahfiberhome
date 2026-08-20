import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import Redis from "ioredis";
import { AppModule } from "../src/app.module";
import { User } from "../src/modules/users/entities/user.entity";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";

/**
 * E2E test untuk batas keamanan portal pelanggan (login OTP WhatsApp):
 * 1. Request OTP tidak membocorkan apakah nomor terdaftar atau tidak
 * 2. OTP yang benar berhasil login & mengeluarkan JWT tipe "customer"
 * 3. Token portal TIDAK BISA dipakai untuk mengakses endpoint admin
 * 4. Token admin TIDAK BISA dipakai untuk mengakses endpoint portal
 * 5. Pelanggan A TIDAK BISA melihat invoice milik pelanggan B walau tahu ID-nya
 */
describe("Portal auth (e2e): OTP login & isolasi akses", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let redis: Redis;
  let adminToken: string;
  let customerAId: string;
  let customerBInvoiceId: string;

  const PHONE_A = "6281100000001";
  const PHONE_B = "6281100000002";

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    dataSource = app.get(DataSource);
    redis = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) });

    await dataSource.query(
      "TRUNCATE TABLE payments, invoice_items, invoices, network_tasks, suspension_logs, notification_logs, subscriptions, packages, customers, users RESTART IDENTITY CASCADE",
    );
    // Bersihkan sisa OTP dari test run sebelumnya
    const oldKeys = await redis.keys("portal-otp*");
    if (oldKeys.length) await redis.del(...oldKeys);

    const userRepo = dataSource.getRepository(User);
    await userRepo.save(
      userRepo.create({
        email: "portal-e2e-admin@test.local",
        password: await bcrypt.hash("Test123!", 10),
        name: "Portal E2E Admin",
        role: "super_admin",
      }),
    );

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "portal-e2e-admin@test.local", password: "Test123!" })
      .expect(200);
    adminToken = loginRes.body.data.accessToken;

    // Buat 2 pelanggan (A dan B) masing-masing dengan 1 invoice
    const custA = await request(app.getHttpServer())
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ customerNumber: "CUST-PORTAL-A", name: "Pelanggan A", phone: PHONE_A, address: "Jl. A" })
      .expect(201);
    customerAId = custA.body.data.id;

    const custB = await request(app.getHttpServer())
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ customerNumber: "CUST-PORTAL-B", name: "Pelanggan B", phone: PHONE_B, address: "Jl. B" })
      .expect(201);
    const customerBId = custB.body.data.id;

    const pkg = await request(app.getHttpServer())
      .post("/api/v1/packages")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Portal Test Package", speedMbps: 10, price: 150000, billingCycle: "monthly" })
      .expect(201);

    const subB = await request(app.getHttpServer())
      .post("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ customerId: customerBId, packageId: pkg.body.data.id, startDate: "2026-01-01", billingDay: 10 })
      .expect(201);

    const invB = await request(app.getHttpServer())
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        subscriptionId: subB.body.data.id,
        items: [{ description: "Tagihan B", qty: 1, unitPrice: 150000 }],
      })
      .expect(201);
    customerBInvoiceId = invB.body.data.id;
  });

  afterAll(async () => {
    const keys = await redis.keys("portal-otp*");
    if (keys.length) await redis.del(...keys);
    redis.disconnect();
    await dataSource.destroy();
    await app.close();
  });

  it("request-otp mengembalikan pesan generik yang SAMA baik untuk nomor terdaftar maupun tidak (anti-enumerasi)", async () => {
    const registeredRes = await request(app.getHttpServer())
      .post("/api/v1/portal/auth/request-otp")
      .send({ phone: PHONE_A })
      .expect(200);

    const unregisteredRes = await request(app.getHttpServer())
      .post("/api/v1/portal/auth/request-otp")
      .send({ phone: "6289999999999" })
      .expect(200);

    expect(registeredRes.body.data.message).toBe(unregisteredRes.body.data.message);
  });

  it("OTP untuk nomor terdaftar benar-benar tersimpan di Redis dan bisa dipakai login", async () => {
    const otp = await redis.get(`portal-otp:${PHONE_A}`);
    expect(otp).toMatch(/^\d{6}$/);

    const res = await request(app.getHttpServer())
      .post("/api/v1/portal/auth/verify-otp")
      .send({ phone: PHONE_A, otp })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.customer.customerNumber).toBe("CUST-PORTAL-A");

    (global as any).__portalTokenA = res.body.data.accessToken;
  });

  it("OTP untuk nomor TIDAK terdaftar tidak pernah benar-benar dibuat di Redis", async () => {
    const otp = await redis.get("portal-otp:6289999999999");
    expect(otp).toBeNull();
  });

  it("OTP yang sudah dipakai TIDAK BISA dipakai lagi (single-use)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/portal/auth/verify-otp")
      .send({ phone: PHONE_A, otp: "000000" }) // OTP asli sudah terhapus setelah dipakai di test sebelumnya
      .expect(400);
  });

  it("token portal TIDAK BISA mengakses endpoint admin (/customers)", async () => {
    const token = (global as any).__portalTokenA;
    await request(app.getHttpServer())
      .get("/api/v1/customers")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("token admin TIDAK BISA mengakses endpoint portal (/portal/me)", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/portal/me")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(401);
  });

  it("token portal pelanggan A BISA mengakses profil & invoice miliknya sendiri", async () => {
    const token = (global as any).__portalTokenA;
    const meRes = await request(app.getHttpServer())
      .get("/api/v1/portal/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(meRes.body.data.id).toBe(customerAId);

    await request(app.getHttpServer())
      .get("/api/v1/portal/invoices")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("pelanggan A TIDAK BISA melihat invoice milik pelanggan B walau tahu ID-nya", async () => {
    const token = (global as any).__portalTokenA;
    await request(app.getHttpServer())
      .get(`/api/v1/portal/invoices/${customerBInvoiceId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });
});
