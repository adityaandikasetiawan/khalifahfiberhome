import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Customer } from "../../customers/entities/customer.entity";
import { Package } from "../../packages/entities/package.entity";
import { Invoice } from "../../invoices/entities/invoice.entity";

export type SubscriptionStatus = "active" | "suspended" | "cancelled";

@Entity("subscriptions")
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Customer, (customer) => customer.subscriptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customer_id" })
  customer: Customer;

  @Column({ name: "customer_id" })
  customerId: string;

  @ManyToOne(() => Package, { eager: true })
  @JoinColumn({ name: "package_id" })
  package: Package;

  @Column({ name: "package_id" })
  packageId: string;

  @Column({ type: "date" })
  startDate: Date;

  @Column({ type: "int", comment: "Tanggal jatuh tempo tiap bulan, 1-28" })
  billingDay: number;

  @Column({ type: "enum", enum: ["active", "suspended", "cancelled"], default: "active" })
  status: SubscriptionStatus;

  @Column({ nullable: true, comment: "Mapping ke profile PPPoE/Mikrotik" })
  mikrotikProfile?: string;

  @Column({ nullable: true, comment: "Username PPPoE di MikroTik" })
  pppoeUsername?: string;

  @Column({ nullable: true, comment: "ID router MikroTik yang mengelola koneksi ini" })
  routerId?: string;

  @Column({ default: "auto_invoice", comment: "Mode isolir: auto_invoice, auto_install_date, manual" })
  isolirMode: string;

  @Column({ type: "int", default: 0, comment: "Jumlah hari setelah jatuh tempo sebelum isolir" })
  isolirDayOffset: number;

  @OneToMany(() => Invoice, (invoice) => invoice.subscription)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
