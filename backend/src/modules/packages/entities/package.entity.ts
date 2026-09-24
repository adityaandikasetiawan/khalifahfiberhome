import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type BillingCycle = "monthly" | "quarterly" | "yearly";

@Entity("packages")
export class Package {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "int", comment: "Kecepatan asli (rate-limit teknis, internal)" })
  speedMbps: number;

  @Column({ name: "display_speed_mbps", type: "int", nullable: true, comment: "Kecepatan yang DITAMPILKAN ke pelanggan (up to X Mbps). Kosong = pakai speedMbps." })
  displaySpeedMbps?: number;

  @Column({ name: "display_desc", nullable: true, comment: "Deskripsi tampil ke pelanggan (mis. 'Cocok untuk beberapa perangkat'). Menggantikan angka kecepatan." })
  displayDesc?: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price: number;

  @Column({ type: "enum", enum: ["monthly", "quarterly", "yearly"], default: "monthly" })
  billingCycle: BillingCycle;

  @Column({ name: "mikrotik_profile", nullable: true, comment: "Nama profile PPPoE di router yang sesuai paket ini" })
  mikrotikProfile?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
