import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type BillingCycle = "monthly" | "quarterly" | "yearly";

@Entity("packages")
export class Package {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "int" })
  speedMbps: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price: number;

  @Column({ type: "enum", enum: ["monthly", "quarterly", "yearly"], default: "monthly" })
  billingCycle: BillingCycle;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
