"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, Wifi, CreditCard, Wrench, UserPlus, Shield } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";

const FAQ_CATEGORIES = [
  {
    title: "Umum",
    icon: Wifi,
    faqs: [
      {
        q: "Apa itu Khalifah Fiber Home?",
        a: "Khalifah Fiber Home adalah penyedia layanan internet berbasis fiber optic (FTTH) yang melayani kebutuhan rumah tangga dan UMKM. Kami menyediakan koneksi internet cepat, stabil, dan terjangkau.",
      },
      {
        q: "Apa keunggulan fiber optic dibanding internet biasa?",
        a: "Fiber optic menggunakan kabel serat optik yang mampu mentransmisikan data dengan kecepatan sangat tinggi dan stabil. Tidak terpengaruh cuaca, interferensi elektromagnetik, dan jarak. Latensi lebih rendah sehingga cocok untuk gaming, video call, dan streaming.",
      },
      {
        q: "Apakah ada batas kuota (FUP)?",
        a: "Tidak. Semua paket Khalifah Fiber Home adalah unlimited tanpa FUP (Fair Usage Policy). Anda bebas menggunakan internet sepuasnya tanpa pembatasan kuota.",
      },
      {
        q: "Bagaimana cara mengetahui area saya terjangkau?",
        a: "Anda dapat mengecek ketersediaan layanan di area Anda melalui halaman 'Cek Area' di website kami, atau langsung menghubungi customer service kami.",
      },
      {
        q: "Apakah ada kontrak minimum berlangganan?",
        a: "Tidak ada kontrak minimum. Anda bisa berlangganan bulanan dan mengajukan berhenti kapan saja dengan pemberitahuan minimal 7 hari kerja sebelum periode tagihan berikutnya.",
      },
    ],
  },
  {
    title: "Pendaftaran & Pemasangan",
    icon: UserPlus,
    faqs: [
      {
        q: "Bagaimana cara mendaftar sebagai pelanggan baru?",
        a: "Anda dapat mendaftar melalui form registrasi di website kami (halaman Daftar), atau hubungi customer service kami. Setelah mendaftar, tim kami akan menghubungi untuk konfirmasi dan jadwal survey.",
      },
      {
        q: "Apa saja syarat untuk mendaftar?",
        a: "Syarat pendaftaran: (1) KTP/identitas yang valid, (2) Alamat pemasangan berada di area yang terjangkau jaringan kami, (3) Usia minimal 17 tahun atau dengan persetujuan orang tua/wali.",
      },
      {
        q: "Berapa lama proses pemasangan setelah mendaftar?",
        a: "Setelah survey lokasi selesai dan pembayaran aktivasi diterima, pemasangan biasanya dilakukan dalam 1-3 hari kerja tergantung kondisi lapangan.",
      },
      {
        q: "Apakah ada biaya pemasangan?",
        a: "Ya, ada biaya instalasi yang dikenakan satu kali saat pemasangan pertama. Besaran biaya tergantung jarak dari titik ODP (Optical Distribution Point) ke lokasi rumah Anda. Tim kami akan menginformasikan saat survey.",
      },
      {
        q: "Perangkat apa yang disediakan?",
        a: "Kami menyediakan ONT (Optical Network Terminal) dan router WiFi secara gratis sebagai pinjaman. Perangkat tetap menjadi milik Khalifah Fiber Home dan wajib dikembalikan jika berhenti berlangganan.",
      },
      {
        q: "Apakah bisa pindah alamat?",
        a: "Bisa. Anda dapat mengajukan pindah alamat dengan menghubungi customer service. Relokasi dikenakan biaya sesuai kondisi di lokasi baru.",
      },
    ],
  },
  {
    title: "Pembayaran & Tagihan",
    icon: CreditCard,
    faqs: [
      {
        q: "Kapan tagihan diterbitkan?",
        a: "Tagihan diterbitkan setiap awal periode berlangganan Anda. Anda akan menerima notifikasi melalui WhatsApp dan bisa melihat detail tagihan di portal pelanggan.",
      },
      {
        q: "Metode pembayaran apa saja yang tersedia?",
        a: "Anda dapat membayar melalui transfer bank, dan payment gateway yang tersedia di portal pelanggan kami. Detail metode pembayaran tertera pada invoice.",
      },
      {
        q: "Apa yang terjadi jika telat bayar?",
        a: "Jika pembayaran melebihi masa tenggang (grace period), layanan internet akan di-isolir (ditangguhkan). Layanan akan aktif kembali otomatis setelah pembayaran dilunasi.",
      },
      {
        q: "Apakah bisa bayar untuk beberapa bulan sekaligus?",
        a: "Ya, Anda bisa melakukan pembayaran di muka untuk beberapa bulan. Hubungi customer service untuk informasi lebih lanjut.",
      },
      {
        q: "Bagaimana kebijakan refund?",
        a: "Pengembalian dana proporsional dapat dilakukan untuk pembayaran di muka jika Anda berhenti berlangganan, atau jika layanan mengalami downtime lebih dari 7 hari karena kendala teknis dari pihak kami. Detail lengkap tersedia di halaman Kebijakan Privasi.",
      },
    ],
  },
  {
    title: "Gangguan & Teknis",
    icon: Wrench,
    faqs: [
      {
        q: "Internet saya lambat/putus, apa yang harus dilakukan?",
        a: "Langkah pertama: (1) Restart router dengan mencabut kabel power selama 30 detik. (2) Cek lampu indikator ONT, pastikan lampu PON menyala hijau. (3) Jika masih bermasalah, laporkan melalui portal pelanggan atau hubungi CS kami.",
      },
      {
        q: "Bagaimana cara melaporkan gangguan?",
        a: "Anda dapat melaporkan gangguan melalui: (1) Portal pelanggan - menu Tiket, (2) WhatsApp CS di 0821-2805-2229. Tim teknis kami akan merespon dan menangani gangguan secepat mungkin.",
      },
      {
        q: "Berapa lama penanganan gangguan?",
        a: "Untuk gangguan ringan (restart perangkat), biasanya selesai dalam beberapa menit. Untuk gangguan jaringan, tim kami akan datang ke lokasi dalam waktu 1x24 jam di hari kerja.",
      },
      {
        q: "Apakah ada maintenance terjadwal?",
        a: "Ya, kami melakukan maintenance berkala untuk menjaga kualitas jaringan. Maintenance terjadwal akan diinfokan sebelumnya melalui WhatsApp atau notifikasi di portal pelanggan.",
      },
      {
        q: "Lampu ONT merah/berkedip, apa artinya?",
        a: "Lampu LOS (merah) berarti ada masalah pada koneksi fiber ke perangkat Anda. Bisa disebabkan kabel putus atau konektor longgar. Jangan coba perbaiki sendiri — segera hubungi tim teknis kami.",
      },
    ],
  },
  {
    title: "Akun & Keamanan",
    icon: Shield,
    faqs: [
      {
        q: "Bagaimana cara login ke portal pelanggan?",
        a: "Akses portal pelanggan di website kami, lalu login menggunakan nomor pelanggan dan password yang diberikan saat aktivasi. Jika lupa password, gunakan fitur reset password atau hubungi CS.",
      },
      {
        q: "Bagaimana cara mengganti password WiFi?",
        a: "Anda bisa mengganti password WiFi melalui halaman konfigurasi router (biasanya 192.168.1.1) atau minta bantuan tim teknis kami melalui tiket di portal pelanggan.",
      },
      {
        q: "Apakah data pribadi saya aman?",
        a: "Ya. Kami menerapkan enkripsi dan kontrol akses ketat untuk melindungi data Anda sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP). Detail lengkap tersedia di halaman Kebijakan Privasi.",
      },
      {
        q: "Bagaimana cara upgrade/downgrade paket?",
        a: "Anda dapat mengajukan perubahan paket melalui portal pelanggan atau menghubungi customer service. Perubahan akan berlaku pada periode tagihan berikutnya.",
      },
    ],
  },
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  function toggleItem(key: string) {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan yang sering diajukan tentang layanan Khalifah Fiber Home
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-10">
            {FAQ_CATEGORIES.map((category, ci) => (
              <div key={ci}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{category.title}</h2>
                </div>
                <div className="space-y-3">
                  {category.faqs.map((faq, fi) => {
                    const key = `${ci}-${fi}`;
                    const isOpen = openItems[key] || false;
                    return (
                      <div key={fi} className="rounded-xl border bg-card overflow-hidden">
                        <button
                          onClick={() => toggleItem(key)}
                          className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold hover:bg-muted/50 transition-colors"
                        >
                          <span className="pr-4">{faq.q}</span>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border bg-card p-8 text-center">
            <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Masih ada pertanyaan?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tim kami siap membantu Anda. Jangan ragu untuk menghubungi kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/kontak"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Hubungi Kami
              </Link>
              <Link
                href="/daftar"
                className="inline-flex items-center justify-center rounded-lg border border-primary/20 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
              >
                Daftar Berlangganan
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
