import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";

@Entity("tickets")
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  customerId: string;

  @Column()
  subject: string;

  @Column({ type: "text" })
  description: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ type: "enum", enum: ["open", "in_progress", "resolved", "closed"], default: "open" })
  status: TicketStatus;

  @Column({ type: "enum", enum: ["low", "medium", "high"], default: "medium" })
  priority: TicketPriority;

  @Column({ nullable: true })
  assignedTo?: string;

  @Column({ type: "timestamp", nullable: true })
  resolvedAt?: Date;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
