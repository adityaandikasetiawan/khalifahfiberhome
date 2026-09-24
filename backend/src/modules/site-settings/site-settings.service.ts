import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSetting } from './entities/site-setting.entity';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSetting)
    private readonly repo: Repository<SiteSetting>,
  ) {}

  async getAll(): Promise<Record<string, any>> {
    const settings = await this.repo.find();
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async getByKey(key: string): Promise<any> {
    const setting = await this.repo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async upsert(key: string, value: any): Promise<SiteSetting> {
    let setting = await this.repo.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
    } else {
      setting = this.repo.create({ key, value });
    }
    return this.repo.save(setting);
  }

  async seed() {
    const count = await this.repo.count();
    if (count > 0) return;

    const defaults: Record<string, any> = {
      company: {
        name: 'Khalifah Fiber Home',
        tagline: 'Internet Fiber Optic Cepat & Stabil',
        description: 'Layanan internet fiber optic cepat, stabil, dan terjangkau untuk rumah dan usaha Anda.',
        address: 'Jl. RTA Milono KM. 8 Komplek Asabru 1 No. 6 RT 003/002, Kel. Kereng Bangkirai, Kec. Sabangau, Kota Palangkaraya, Kalimantan Tengah 73111',
        phone: '0821-2805-2229',
        whatsapp: '6282128052229',
        email: 'info@khalifahfiberhome.id',
      },
      hero_slides: [
        {
          badge: 'Internet Fiber Optic',
          title: 'Internet',
          highlight: 'Cepat & Stabil',
          subtitle: 'Tanpa Batas',
          description: 'Khalifah Fiber Home menyediakan layanan internet fiber optic berkualitas tinggi dengan harga terjangkau.',
          ctaText: 'Daftar Sekarang',
          ctaLink: '/daftar',
          ctaSecondaryText: 'Lihat Paket',
          ctaSecondaryLink: '/paket',
          statValue: '100',
          statUnit: 'Mbps',
          statLabel: 'Kecepatan Maksimal',
        },
        {
          badge: 'Promo Spesial',
          title: 'Gratis',
          highlight: 'Instalasi',
          subtitle: 'Untuk Pelanggan Baru',
          description: 'Daftar sekarang dan nikmati pemasangan gratis serta router WiFi gratis untuk paket Home 20 ke atas.',
          ctaText: 'Daftar Sekarang',
          ctaLink: '/daftar',
          ctaSecondaryText: 'Cek Area',
          ctaSecondaryLink: '/cek-area',
          statValue: '0',
          statUnit: 'Rp',
          statLabel: 'Biaya Instalasi*',
        },
        {
          badge: 'Tanpa FUP',
          title: 'Unlimited',
          highlight: 'Tanpa Batas',
          subtitle: 'Sepuasnya 24/7',
          description: 'Streaming, gaming, video call, dan download sepuasnya tanpa kuota.',
          ctaText: 'Pilih Paket',
          ctaLink: '/paket',
          ctaSecondaryText: 'FAQ',
          ctaSecondaryLink: '/faq',
          statValue: '∞',
          statUnit: '',
          statLabel: 'Unlimited Data',
        },
      ],
      features: [
        { title: 'Kecepatan Tinggi', description: 'Bandwidth dedicated hingga 100Mbps dengan fiber optic langsung ke rumah Anda', icon: 'Zap' },
        { title: 'Stabil 24/7', description: 'Uptime 99.9% dengan backup link dan monitoring jaringan real-time', icon: 'Shield' },
        { title: 'Support Responsif', description: 'Tim teknis profesional siap membantu kapan saja via WhatsApp', icon: 'Headphones' },
        { title: 'Coverage Luas', description: 'Jaringan fiber optic terus berkembang menjangkau lebih banyak area', icon: 'Globe' },
        { title: 'Pemasangan Cepat', description: 'Proses instalasi selesai dalam 1-3 hari kerja setelah survey', icon: 'Clock' },
        { title: 'Tanpa FUP', description: 'Nikmati internet tanpa batas kuota, bebas streaming dan gaming sepuasnya', icon: 'Users' },
      ],
      testimonials: [
        { name: 'Budi Santoso', role: 'Pelanggan Home 20', text: 'Sudah 2 tahun pakai Khalifah Fiber, koneksi stabil jarang gangguan. Support-nya juga fast response.' },
        { name: 'Siti Rahayu', role: 'Pelanggan Home 50', text: 'Akhirnya nemu ISP yang bener-bener dedicated. Streaming 4K lancar, gaming tanpa lag.' },
        { name: 'Ahmad Fauzi', role: 'Pelanggan Home 10', text: 'Harga terjangkau tapi kualitas oke. Pemasangan juga cepat, tidak sampai 2 hari sudah bisa dipakai.' },
      ],
      social_links: {
        facebook: '',
        instagram: '',
        tiktok: '',
        youtube: '',
      },
    };

    for (const [key, value] of Object.entries(defaults)) {
      await this.repo.save(this.repo.create({ key, value }));
    }
  }
}
