import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type NotificationChannel = "whatsapp" | "email" | "sms";
export type NotificationType =
  | "invoice_created"
  | "reminder_h3"
  | "reminder_h1"
  | "overdue"
  | "isolir"
  | "payment_success";

@Entity("notification_logs")
export class NotificationLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "customer_id" })
  customerId: string;

  @Column({ name: "invoice_id", nullable: true })
  invoiceId?: string;

  @Column({ type: "enum", enum: ["whatsapp", "email", "sms"] })
  channel: NotificationChannel;

  @Column({
    type: "enum",
    enum: ["invoice_created", "reminder_h3", "reminder_h1", "overdue", "isolir", "payment_success"],
  })
  type: NotificationType;

  @Column({ type: "enum", enum: ["sent", "failed"] })
  status: "sent" | "failed";

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  sentAt: Date;
}
