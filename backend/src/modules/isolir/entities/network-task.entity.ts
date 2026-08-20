import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type NetworkTaskType = "suspend" | "activate";
export type NetworkTaskStatus = "pending" | "in_progress" | "done" | "cancelled";

/**
 * Tabel network_tasks merepresentasikan antrian kerja manual untuk
 * teknisi/NOC -- lihat keputusan arsitektur: isolir/aktivasi belum
 * otomatis ke Mikrotik, namun skema ini disiapkan agar migrasi ke
 * otomasi penuh tidak memerlukan perubahan schema (cukup tambahkan
 * proses yang mengonsumsi task ini secara otomatis).
 */
@Entity("network_tasks")
export class NetworkTask {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "subscription_id" })
  subscriptionId: string;

  @Column({ name: "invoice_id", nullable: true })
  invoiceId?: string;

  @Column({ type: "enum", enum: ["suspend", "activate"] })
  type: NetworkTaskType;

  @Column({ type: "enum", enum: ["pending", "in_progress", "done", "cancelled"], default: "pending" })
  status: NetworkTaskStatus;

  @Column({ nullable: true })
  assignedTo?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
