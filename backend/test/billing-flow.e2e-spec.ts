import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { AppModule } from "../src/app.module";
import { User } from "../src/modules/users/entities/user.entity";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";

/**
 * E2E test alur bisnis inti: INVOICE -> PAYMENT WEBHOOK -> AKTIVASI OTOMATIS.
 *
 * Mensimulasikan skenario nyata:
 * 1. Pelanggan dengan subscription "suspended" (misal karena tunggakan sebelumnya)
 * 2. Invoice baru dibuat & harus dibayar
 * 3. Payment gateway mengirim webhook sukses (dengan signature Midtrans yang VALID,
 *    dihitung dengan algoritma sungguhan -- bukan mock -- agar verifikasi signature
 *    juga ikut teruji)
 * 4. Invoice harus berstatus "paid"
 * 5. Tugas aktivasi otomatis harus muncul di antrian isolir-tasks untuk teknisi
 * 6. Webhook yang SAMA dikirim ulang (simulasi retry payment gateway) TIDAK boleh
 *    memproses ulang atau membuat tugas aktivasi kedua kali (idempotency)
 */
describe("Billing flow (e2e): invoice -> payment webhook -> aktivasi", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let customerId: string;
  let packageId: string;
  let subscriptionId: string;
  let invoiceId: string;

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

    // Bersihkan tabel transaksional agar test idempotent saat dijalankan berulang
    await dataSource.query(
      "TRUNCATE TABLE payments, invoice_items, invoices, network_tasks, suspension_logs, notification_logs, subscriptions, packages, customers, users RESTART IDENTITY CASCADE",
    );

    // Buat admin user langsung lewat repository (tanpa lewat endpoint register)
    const userRepo = dataSource.getRepository(User);
    await userRepo.save(
      userRepo.create({
        email: "e2e-admin@test.local",
        password: await bcrypt.hash("Test123!", 10),
        name: "E2E Admin",
        role: "super_admin",
      }),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it("login sebagai admin dan mendapatkan JWT", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "e2e-admin@test.local", password: "Test123!" })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
  });

  it("membuat pelanggan, paket, dan subscription (kondisi awal: suspended)", async () => {
    const customerRes = await request(app.getHttpServer())
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        customerNumber: "CUST-E2E-01",
        name: "Pelanggan E2E",
        phone: "6281200000001",
        address: "Jl. Testing No. 1",
      })
      .expect(201);
    customerId = customerRes.body.data.id;

    const packageRes = await request(app.getHttpServer())
      .post("/api/v1/packages")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Home 20Mbps E2E", speedMbps: 20, price: 250000, billingCycle: "monthly" })
      .expect(201);
    packageId = packageRes.body.data.id;

    const subRes = await request(app.getHttpServer())
      .post("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        customerId,
        packageId,
        startDate: "2026-01-01",
        billingDay: 15,
      })
      .expect(201);
    subscriptionId = subRes.body.data.id;

    // Set subscription menjadi suspended untuk menguji skenario aktivasi otomatis
    await request(app.getHttpServer())
      .patch(`/api/v1/subscriptions/${subscriptionId}/suspend`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });

  it("membuat invoice manual untuk subscription tersebut", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        subscriptionId,
        items: [{ description: "Tagihan bulanan (E2E)", qty: 1, unitPrice: 250000 }],
      })
      .expect(201);

    invoiceId = res.body.data.id;
    expect(res.body.data.status).toBe("unpaid");
    expect(Number(res.body.data.totalAmount)).toBe(250000);
  });

  function buildMidtransSignature(orderId: string, statusCode: string, grossAmount: string) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    return crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");
  }

  it("menyimulasikan payment pending di database, lalu kirim webhook Midtrans dengan signature VALID", async () => {
    // Baris ini merepresentasikan payment yang seharusnya dibuat oleh
    // POST /payments/create-transaction pada kondisi dengan kredensial
    // gateway asli (tidak dipanggil di sini karena sandbox butuh internet
    // + kredensial Midtrans sungguhan yang belum tersedia di lingkungan ini).
    const orderId = `E2E-ORDER-${invoiceId.slice(0, 8)}`;
    await dataSource.query(
      `INSERT INTO payments (id, invoice_id, "paymentMethod", "gatewayReference", amount, status, "createdAt")
       VALUES (uuid_generate_v4(), $1, 'va', $2, 250000, 'pending', now())`,
      [invoiceId, orderId],
    );

    const grossAmount = "250000.00";
    const statusCode = "200";
    const signature = buildMidtransSignature(orderId, statusCode, grossAmount);

    const res = await request(app.getHttpServer())
      .post("/api/v1/webhooks/payment-gateway/midtrans")
      .send({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: "settlement",
      })
      .expect(200);

    expect(res.body.data.status).toBe("success");

    // Job BullMQ untuk queue "isolir" diproses async lewat Redis -- beri jeda
    // singkat agar IsolirProcessor sempat menjalankan createActivateTask()
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Invoice harus sudah berstatus paid
    const invoiceRes = await request(app.getHttpServer())
      .get(`/api/v1/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(invoiceRes.body.data.status).toBe("paid");

    // Tugas aktivasi otomatis harus muncul karena subscription tadi di-suspend
    const tasksRes = await request(app.getHttpServer())
      .get("/api/v1/isolir-tasks")
      .query({ status: "pending" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const activateTask = tasksRes.body.data.find(
      (t: any) => t.subscriptionId === subscriptionId && t.type === "activate",
    );
    expect(activateTask).toBeDefined();

    (global as any).__lastOrderId = orderId;
    (global as any).__lastSignature = signature;
    (global as any).__lastStatusCode = statusCode;
    (global as any).__lastGrossAmount = grossAmount;
  });

  it("MENOLAK signature yang tidak valid (percobaan pemalsuan webhook)", async () => {
    const orderId = (global as any).__lastOrderId;
    await request(app.getHttpServer())
      .post("/api/v1/webhooks/payment-gateway/midtrans")
      .send({
        order_id: orderId,
        status_code: "200",
        gross_amount: "250000.00",
        signature_key: "signature-palsu-tidak-valid",
        transaction_status: "settlement",
      })
      .expect(401);
  });

  it("mengirim ULANG webhook yang sama (simulasi retry gateway) -- TIDAK memproses ulang & TIDAK membuat tugas aktivasi kedua", async () => {
    const orderId = (global as any).__lastOrderId;
    const signature = (global as any).__lastSignature;
    const statusCode = (global as any).__lastStatusCode;
    const grossAmount = (global as any).__lastGrossAmount;

    await request(app.getHttpServer())
      .post("/api/v1/webhooks/payment-gateway/midtrans")
      .send({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: "settlement",
      })
      .expect(200);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const tasksRes = await request(app.getHttpServer())
      .get("/api/v1/isolir-tasks")
      .query({ status: "pending" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const activateTasks = tasksRes.body.data.filter(
      (t: any) => t.subscriptionId === subscriptionId && t.type === "activate",
    );
    // Harus tetap cuma 1 tugas aktivasi walau webhook dikirim 2 kali
    expect(activateTasks).toHaveLength(1);
  });

  it("teknisi menyelesaikan tugas aktivasi -> subscription kembali berstatus active", async () => {
    const tasksRes = await request(app.getHttpServer())
      .get("/api/v1/isolir-tasks")
      .query({ status: "pending" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const activateTask = tasksRes.body.data.find(
      (t: any) => t.subscriptionId === subscriptionId && t.type === "activate",
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/isolir-tasks/${activateTask.id}/complete`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const subRes = await request(app.getHttpServer())
      .get(`/api/v1/subscriptions/${subscriptionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(subRes.body.data.status).toBe("active");
  });
});
