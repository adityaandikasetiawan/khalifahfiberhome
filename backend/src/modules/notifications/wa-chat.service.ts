import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WaMessage } from "./entities/wa-message.entity";
import { Customer } from "../customers/entities/customer.entity";
import { WhatsAppService } from "./whatsapp.service";

@Injectable()
export class WaChatService {
  constructor(
    @InjectRepository(WaMessage) private readonly repo: Repository<WaMessage>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  private normalizePhone(raw: string): string {
    let n = (raw || "").replace(/[\s\-()+]/g, "").trim();
    if (n.startsWith("0")) n = "62" + n.slice(1);
    if (!n.startsWith("62") && n) n = "62" + n;
    return n;
  }

  /**
   * Daftar percakapan: 1 baris per nomor, dengan pesan terakhir + jumlah belum
   * dibaca + nama pelanggan (jika nomornya cocok dengan data customer).
   */
  async listConversations() {
    // Pesan terakhir per phone + hitung unread (raw query untuk efisiensi)
    const rows = await this.repo.query(`
      SELECT m.phone,
             m.body         AS last_body,
             m.type         AS last_type,
             m.direction    AS last_direction,
             m."createdAt"  AS last_at,
             m.sender_name  AS sender_name,
             u.unread
      FROM (
        SELECT DISTINCT ON (phone) phone, body, type, direction, "createdAt", sender_name
        FROM wa_messages ORDER BY phone, "createdAt" DESC
      ) m
      LEFT JOIN (
        SELECT phone, COUNT(*)::int AS unread
        FROM wa_messages WHERE direction='in' AND is_read=false GROUP BY phone
      ) u ON u.phone = m.phone
      ORDER BY m."createdAt" DESC
    `);

    // Lampirkan nama pelanggan dari tabel customers (match by phone)
    const phones = rows.map((r: any) => r.phone);
    const custMap = new Map<string, { name: string; customerNumber: string }>();
    if (phones.length) {
      const custs = await this.customerRepo
        .createQueryBuilder("c")
        .select(["c.name AS name", "c.phone AS phone", 'c."customerNumber" AS cnum'])
        .where("c.phone IN (:...phones)", { phones })
        .getRawMany();
      for (const c of custs) custMap.set(c.phone, { name: c.name, customerNumber: c.cnum });
    }

    return rows.map((r: any) => ({
      phone: r.phone,
      name: custMap.get(r.phone)?.name ?? r.sender_name ?? null,
      customerNumber: custMap.get(r.phone)?.customerNumber ?? null,
      lastBody: r.last_type === "image" ? (r.last_body || "📷 Gambar") : r.last_body,
      lastType: r.last_type,
      lastDirection: r.last_direction,
      lastAt: r.last_at,
      unread: r.unread ?? 0,
    }));
  }

  /** Ambil histori 1 percakapan (urut lama->baru) + tandai pesan masuk sudah dibaca. */
  async getConversation(phone: string, limit = 200) {
    const p = this.normalizePhone(phone);
    const messages = await this.repo.find({
      where: { phone: p },
      order: { createdAt: "ASC" },
      take: limit,
    });
    // Tandai pesan masuk sebagai sudah dibaca
    await this.repo.update({ phone: p, direction: "in", isRead: false }, { isRead: true });

    const customer = await this.customerRepo.findOne({ where: { phone: p } });
    return {
      phone: p,
      customer: customer ? { name: customer.name, customerNumber: customer.customerNumber } : null,
      messages,
    };
  }

  /** Kirim pesan (teks + gambar opsional) ke nomor; tersimpan ke histori via WhatsAppService. */
  async sendChat(phone: string, body: string, imageUrl?: string) {
    const p = this.normalizePhone(phone);
    await this.whatsAppService.sendMessage(p, body ?? "", imageUrl);
    return { ok: true };
  }

  /** Jumlah total pesan masuk belum dibaca (untuk badge menu). */
  async unreadCount(): Promise<number> {
    return this.repo.count({ where: { direction: "in", isRead: false } });
  }

  /**
   * Statistik penggunaan & biaya WhatsApp. Biaya dihitung dari pesan KELUAR
   * (direction='out') — yaitu pesan yang DIKIRIM sistem ke pelanggan (notifikasi
   * tagihan, pembayaran, broadcast, chat admin). Pesan masuk tidak dikenai biaya.
   *
   * @param costPerMessage biaya per pesan (default Rp500)
   * @param from/to filter rentang tanggal opsional (YYYY-MM-DD)
   */
  async usageStats(costPerMessage = 500, from?: string, to?: string) {
    const qb = this.repo
      .createQueryBuilder("m")
      .where("m.direction = :dir", { dir: "out" });
    if (from) qb.andWhere('m."createdAt" >= :from', { from: `${from} 00:00:00` });
    if (to) qb.andWhere('m."createdAt" <= :to', { to: `${to} 23:59:59` });

    const totalSent = await qb.getCount();

    // Breakdown per bulan (YYYY-MM).
    const perMonth = await this.repo.query(
      `SELECT to_char("createdAt", 'YYYY-MM') AS periode, COUNT(*)::int AS jumlah
       FROM wa_messages
       WHERE direction = 'out'
         ${from ? `AND "createdAt" >= '${from} 00:00:00'` : ""}
         ${to ? `AND "createdAt" <= '${to} 23:59:59'` : ""}
       GROUP BY 1 ORDER BY 1 DESC`,
    );

    // Breakdown per tipe pesan (text/image/document).
    const perType = await this.repo.query(
      `SELECT type AS tipe, COUNT(*)::int AS jumlah
       FROM wa_messages
       WHERE direction = 'out'
         ${from ? `AND "createdAt" >= '${from} 00:00:00'` : ""}
         ${to ? `AND "createdAt" <= '${to} 23:59:59'` : ""}
       GROUP BY 1 ORDER BY 2 DESC`,
    );

    return {
      costPerMessage,
      totalSent,
      totalCost: totalSent * costPerMessage,
      perMonth: perMonth.map((r: any) => ({
        periode: r.periode,
        jumlah: r.jumlah,
        biaya: r.jumlah * costPerMessage,
      })),
      perType: perType.map((r: any) => ({ tipe: r.tipe, jumlah: r.jumlah })),
    };
  }
}
