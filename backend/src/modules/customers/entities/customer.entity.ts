import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Subscription } from "../../subscriptions/entities/subscription.entity";

export type CustomerStatus = "active" | "suspended" | "terminated";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  customerNumber: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: "text" })
  address: string;

  @Column({ type: "date", nullable: true })
  installationDate?: Date;

  @Column({ type: "enum", enum: ["active", "suspended", "terminated"], default: "active" })
  status: CustomerStatus;

  @OneToMany(() => Subscription, (subscription) => subscription.customer)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
