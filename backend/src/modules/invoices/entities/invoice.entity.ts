import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Subscription } from "../../subscriptions/entities/subscription.entity";
import { InvoiceItem } from "./invoice-item.entity";
import { Payment } from "../../payments/entities/payment.entity";

export type InvoiceStatus = "draft" | "unpaid" | "paid" | "overdue" | "cancelled";

@Entity("invoices")
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.invoices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subscription_id" })
  subscription: Subscription;

  @Column({ name: "subscription_id" })
  subscriptionId: string;

  @Column({ type: "date" })
  periodStart: Date;

  @Column({ type: "date" })
  periodEnd: Date;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: "date" })
  dueDate: Date;

  @Column({ type: "enum", enum: ["draft", "unpaid", "paid", "overdue", "cancelled"], default: "unpaid" })
  status: InvoiceStatus;

  @Column({ type: "timestamp", nullable: true })
  paidAt?: Date;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
