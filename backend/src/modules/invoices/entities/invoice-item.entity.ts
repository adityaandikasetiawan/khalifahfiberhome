import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Invoice } from "./invoice.entity";

@Entity("invoice_items")
export class InvoiceItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoice_id" })
  invoice: Invoice;

  @Column({ name: "invoice_id" })
  invoiceId: string;

  @Column()
  description: string;

  @Column({ type: "int", default: 1 })
  qty: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal: number;
}
