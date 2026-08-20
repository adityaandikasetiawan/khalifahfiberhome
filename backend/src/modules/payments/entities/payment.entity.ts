import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Invoice } from "../../invoices/entities/invoice.entity";

export type PaymentMethod = "bank_transfer" | "va" | "ewallet" | "cash" | "qris";
export type PaymentStatus = "pending" | "success" | "failed" | "expired";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoice_id" })
  invoice: Invoice;

  @Column({ name: "invoice_id" })
  invoiceId: string;

  @Column({ type: "enum", enum: ["bank_transfer", "va", "ewallet", "cash", "qris"] })
  paymentMethod: PaymentMethod;

  @Column({ unique: true, nullable: true })
  gatewayReference?: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ type: "enum", enum: ["pending", "success", "failed", "expired"], default: "pending" })
  status: PaymentStatus;

  @Column({ type: "timestamp", nullable: true })
  paidAt?: Date;

  @Column({ type: "jsonb", nullable: true, comment: "Raw webhook payload untuk audit" })
  rawPayload?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
