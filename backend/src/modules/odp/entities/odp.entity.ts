import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("odp")
export class Odp {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "int" })
  totalPorts: number;

  @Column({ type: "int", default: 0 })
  usedPorts: number;

  @Column({ type: "decimal", nullable: true })
  latitude?: number;

  @Column({ type: "decimal", nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ nullable: true })
  routerId?: string;

  @Column({ nullable: true })
  technicianId?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
