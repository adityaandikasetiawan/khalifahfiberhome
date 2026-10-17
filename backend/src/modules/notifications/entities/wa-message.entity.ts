import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

export type WaDirection = "in" | "out";
export type WaMessageType = "text" | "image" | "document" | "other";

/**
 * Riwayat percakapan WhatsApp (masuk & keluar) via gateway.
 * Dipakai untuk fitur "chat" di panel admin: lihat histori per nomor pelanggan,
 * termasuk gambar. Hanya pesan sejak fitur ini aktif yang terekam (keterbatasan
 * whatsapp-web.js tidak menarik histori lama).
 */
@Entity("wa_messages")
@Index(["phone", "createdAt"])
export class WaMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** Nomor lawan bicara (pelanggan) dalam format 62xxxx (tanpa @c.us). */
  @Column()
  @Index()
  phone: string;

  /** "in" = dari pelanggan, "out" = dari admin/sistem. */
  @Column({ type: "enum", enum: ["in", "out"] })
  direction: WaDirection;

  @Column({ type: "enum", enum: ["text", "image", "document", "other"], default: "text" })
  type: WaMessageType;

  @Column({ type: "text", nullable: true })
  body?: string;

  /** URL media lokal (mis. /uploads/wa/xxx.jpg) jika pesan berisi gambar/file. */
  @Column({ name: "media_url", type: "varchar", nullable: true })
  mediaUrl?: string;

  /** Nama pengirim di WhatsApp (pushname), untuk pesan masuk. */
  @Column({ name: "sender_name", type: "varchar", nullable: true })
  senderName?: string;

  /** ID pesan dari WhatsApp (untuk dedup). */
  @Column({ name: "wa_message_id", type: "varchar", nullable: true, unique: true })
  waMessageId?: string;

  /** Apakah pesan masuk sudah dibaca admin. */
  @Column({ name: "is_read", type: "boolean", default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
