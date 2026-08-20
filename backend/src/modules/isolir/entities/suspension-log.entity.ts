import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type SuspensionAction = "suspend" | "activate";
export type TriggeredBy = "system" | "admin";

@Entity("suspension_logs")
export class SuspensionLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "subscription_id" })
  subscriptionId: string;

  @Column({ type: "enum", enum: ["suspend", "activate"] })
  action: SuspensionAction;

  @Column({ type: "text", nullable: true })
  reason?: string;

  @Column({ type: "enum", enum: ["system", "admin"] })
  triggeredBy: TriggeredBy;

  @CreateDateColumn()
  createdAt: Date;
}
