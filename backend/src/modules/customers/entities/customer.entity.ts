import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Subscription } from "../../subscriptions/entities/subscription.entity";

export type CustomerStatus =
  | "active"
  | "suspended"
  | "terminated"
  | "pending_verification" // baru daftar, email belum diverifikasi
  | "pending_active"; // sudah bayar registrasi, menunggu approval teknisi

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

  @Column({
    type: "enum",
    enum: ["active", "suspended", "terminated", "pending_verification", "pending_active"],
    default: "active",
  })
  status: CustomerStatus;

  // ─── Field registrasi mandiri (self-registration) ───────────────
  @Column({ nullable: true, comment: "NIK KTP pelanggan (dari form registrasi)" })
  nik?: string;

  @Column({ name: "email_verification_token", nullable: true, select: false })
  emailVerificationToken?: string;

  @Column({ name: "email_verified_at", type: "timestamptz", nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: "is_new_registration", default: false, comment: "True jika pelanggan hasil registrasi mandiri yang belum pernah aktif" })
  isNewRegistration: boolean;

  // ─── Login portal via email + password ──────────────────────────
  @Column({ name: "password", nullable: true, select: false, comment: "Hash bcrypt password portal pelanggan" })
  password?: string;

  @Column({ name: "password_set_at", type: "timestamptz", nullable: true, comment: "Kapan password terakhir diset (null = belum punya password)" })
  passwordSetAt?: Date;

  @Column({ name: "password_reset_token", nullable: true, select: false })
  passwordResetToken?: string;

  @Column({ name: "password_reset_expires", type: "timestamptz", nullable: true, select: false })
  passwordResetExpires?: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.customer)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
