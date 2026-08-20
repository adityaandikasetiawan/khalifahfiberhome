import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type BroadcastTargetType = "all" | "router" | "loket";
export type BroadcastStatus = "draft" | "sending" | "sent";

@Entity("broadcast")
export class Broadcast {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "enum", enum: ["all", "router", "loket"], default: "all" })
  targetType: BroadcastTargetType;

  @Column({ nullable: true })
  targetRouterId?: string;

  @Column({ type: "int", default: 0 })
  sentCount: number;

  @Column({ type: "int", default: 0 })
  failedCount: number;

  @Column({ type: "enum", enum: ["draft", "sending", "sent"], default: "draft" })
  status: BroadcastStatus;

  @Column({ type: "timestamp", nullable: true })
  sentAt?: Date;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
