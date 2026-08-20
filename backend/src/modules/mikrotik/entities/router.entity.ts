import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("routers")
export class Router {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: "Nama identitas router (misal: RB-Cluster-01)" })
  name: string;

  @Column({ comment: "IP address atau hostname router MikroTik" })
  host: string;

  @Column({ type: "int", default: 8728, comment: "Port API RouterOS (default 8728, TLS 8729)" })
  port: number;

  @Column({ comment: "Username API MikroTik" })
  username: string;

  @Column({ comment: "Password API MikroTik (tersimpan encrypted di production)" })
  password: string;

  @Column({ default: false, comment: "Gunakan TLS (port 8729)" })
  useTls: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, comment: "Catatan/lokasi router" })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
