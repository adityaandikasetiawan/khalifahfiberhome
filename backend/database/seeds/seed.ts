import "reflect-metadata";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../src/modules/users/entities/user.entity";
import { Customer } from "../../src/modules/customers/entities/customer.entity";
import { Package } from "../../src/modules/packages/entities/package.entity";
import { Subscription } from "../../src/modules/subscriptions/entities/subscription.entity";

/**
 * Seed data awal: 1 admin user, 3 paket internet, 2 pelanggan contoh
 * beserta subscription-nya. Jalankan dengan: npm run seed
 */
async function seed() {
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "isp_billing",
    entities: [User, Customer, Package, Subscription, __dirname + "/../../src/**/*.entity.ts"],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log("Terhubung ke database, memulai seeding...");

  const userRepo = dataSource.getRepository(User);
  const existingAdmin = await userRepo.findOne({ where: { email: "admin@ispbilling.local" } });
  if (!existingAdmin) {
    await userRepo.save(
      userRepo.create({
        email: "admin@ispbilling.local",
        password: await bcrypt.hash("Admin123!", 10),
        name: "Super Admin",
        role: "super_admin",
      }),
    );
    console.log("Admin user dibuat: admin@ispbilling.local / Admin123!");
  }

  const packageRepo = dataSource.getRepository(Package);
  let packages = await packageRepo.find();
  if (packages.length === 0) {
    packages = await packageRepo.save([
      packageRepo.create({ name: "Home 10Mbps", speedMbps: 10, price: 150000, billingCycle: "monthly" }),
      packageRepo.create({ name: "Home 20Mbps", speedMbps: 20, price: 250000, billingCycle: "monthly" }),
      packageRepo.create({ name: "Business 50Mbps", speedMbps: 50, price: 750000, billingCycle: "monthly" }),
    ]);
    console.log(`${packages.length} paket internet dibuat`);
  }

  const customerRepo = dataSource.getRepository(Customer);
  let customer = await customerRepo.findOne({ where: { customerNumber: "CUST-00001" } });
  if (!customer) {
    customer = await customerRepo.save(
      customerRepo.create({
        customerNumber: "CUST-00001",
        name: "Budi Santoso",
        phone: "6281234567890",
        email: "budi@example.com",
        address: "Jl. Merdeka No. 10, Jakarta",
        installationDate: new Date(),
        status: "active",
      }),
    );
    console.log("Pelanggan contoh dibuat: CUST-00001 - Budi Santoso");
  }

  const subscriptionRepo = dataSource.getRepository(Subscription);
  const existingSub = await subscriptionRepo.findOne({ where: { customerId: customer.id } });
  if (!existingSub) {
    await subscriptionRepo.save(
      subscriptionRepo.create({
        customerId: customer.id,
        packageId: packages[1].id,
        startDate: new Date(),
        billingDay: new Date().getDate(),
        status: "active",
      }),
    );
    console.log("Subscription contoh dibuat untuk CUST-00001");
  }

  console.log("Seeding selesai.");
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error("Seeding gagal:", err);
  process.exit(1);
});
