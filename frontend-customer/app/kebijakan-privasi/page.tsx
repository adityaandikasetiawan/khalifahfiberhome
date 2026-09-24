import { Shield, Database, Eye, Lock, UserCheck, Bell, HelpCircle, Globe, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function KebijakanPrivasiPage() {
  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Kebijakan Privasi</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Kebijakan privasi dan perlindungan data pelanggan Khalifah Fiber Home
          </p>
          <p className="text-sm text-muted-foreground mt-4">Terakhir diperbarui: 20 Agustus 2026</p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-8">

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">1. Pendahuluan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Khalifah Fiber Home berkomitmen untuk melindungi privasi dan keamanan data pribadi pelanggan. Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda.</p>
                <p>Dengan menggunakan layanan kami, Anda menyetujui praktik pengumpulan dan penggunaan data yang dijelaskan dalam kebijakan ini sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) yang berlaku di Indonesia.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">2. Data yang Kami Kumpulkan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Kami mengumpulkan informasi berikut saat Anda mendaftar dan menggunakan layanan kami:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Data identitas:</strong> Nama lengkap, nomor KTP/identitas, tanggal lahir</li>
                  <li><strong>Data kontak:</strong> Alamat rumah/instalasi, nomor telepon, alamat email</li>
                  <li><strong>Data pembayaran:</strong> Riwayat transaksi dan metode pembayaran</li>
                  <li><strong>Data layanan:</strong> Paket berlangganan, riwayat penggunaan, log koneksi</li>
                  <li><strong>Data teknis:</strong> Alamat IP, MAC address perangkat, informasi perangkat yang terhubung</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">3. Penggunaan Data</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Data pribadi Anda digunakan untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Menyediakan dan mengelola layanan internet yang Anda langgani</li>
                  <li>Memproses pembayaran dan mengirimkan invoice/tagihan</li>
                  <li>Menghubungi Anda terkait layanan, gangguan, atau maintenance</li>
                  <li>Meningkatkan kualitas layanan dan pengalaman pelanggan</li>
                  <li>Mengirimkan informasi promosi atau penawaran (dengan persetujuan Anda)</li>
                  <li>Memenuhi kewajiban hukum dan regulasi yang berlaku</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">4. Keamanan Data</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data pribadi Anda, termasuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Enkripsi data saat transmisi dan penyimpanan</li>
                  <li>Akses terbatas hanya untuk personel yang berwenang</li>
                  <li>Sistem monitoring keamanan secara berkala</li>
                  <li>Backup data secara rutin untuk mencegah kehilangan data</li>
                </ul>
                <p>Meskipun demikian, tidak ada sistem yang 100% aman. Kami akan segera memberitahu Anda jika terjadi pelanggaran data yang berdampak pada informasi pribadi Anda.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. Berbagi Data dengan Pihak Ketiga</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Kami tidak menjual data pribadi Anda kepada pihak ketiga. Data hanya dibagikan dalam kondisi berikut:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Payment gateway:</strong> Untuk memproses pembayaran Anda</li>
                  <li><strong>Penyedia layanan WhatsApp:</strong> Untuk pengiriman notifikasi tagihan dan informasi layanan</li>
                  <li><strong>Kewajiban hukum:</strong> Jika diwajibkan oleh peraturan perundang-undangan atau perintah pengadilan</li>
                </ul>
                <p>Setiap pihak ketiga yang menerima data Anda diwajibkan menjaga kerahasiaan dan keamanan data tersebut.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">6. Hak Pelanggan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Sebagai pelanggan, Anda memiliki hak atas data pribadi Anda:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Hak akses:</strong> Meminta salinan data pribadi yang kami simpan</li>
                  <li><strong>Hak koreksi:</strong> Memperbarui atau memperbaiki data yang tidak akurat</li>
                  <li><strong>Hak hapus:</strong> Meminta penghapusan data pribadi (dengan batasan tertentu)</li>
                  <li><strong>Hak keberatan:</strong> Menolak penggunaan data untuk tujuan pemasaran</li>
                  <li><strong>Hak portabilitas:</strong> Meminta data Anda dalam format yang dapat dipindahkan</li>
                </ul>
                <p>Untuk menggunakan hak-hak tersebut, silakan hubungi kami melalui kontak yang tersedia.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <RotateCcw className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">7. Kebijakan Pengembalian Dana (Refund)</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Khalifah Fiber Home menerapkan kebijakan pengembalian dana dengan ketentuan sebagai berikut:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Biaya instalasi:</strong> Tidak dapat dikembalikan setelah proses pemasangan selesai dilakukan.</li>
                  <li><strong>Biaya berlangganan bulanan:</strong> Pengembalian dana proporsional (prorata) dapat dilakukan jika layanan dihentikan oleh pihak Khalifah Fiber Home karena kendala teknis yang tidak dapat diselesaikan dalam waktu lebih dari 7 hari berturut-turut.</li>
                  <li><strong>Pembayaran di muka (lebih dari 1 bulan):</strong> Sisa periode yang belum terpakai akan dikembalikan secara proporsional jika pelanggan mengajukan berhenti berlangganan.</li>
                  <li><strong>Gangguan layanan:</strong> Kompensasi berupa perpanjangan masa berlangganan akan diberikan jika terjadi downtime lebih dari 24 jam berturut-turut yang bukan disebabkan oleh force majeure.</li>
                </ul>
                <p className="font-medium text-foreground">Prosedur pengajuan refund:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Ajukan permohonan melalui portal pelanggan atau hubungi customer service</li>
                  <li>Tim kami akan memverifikasi dan memproses dalam 7-14 hari kerja</li>
                  <li>Dana akan dikembalikan melalui transfer bank ke rekening yang terdaftar</li>
                </ol>
                <p>Khalifah Fiber Home berhak menolak permohonan refund jika pelanggan melanggar Syarat & Ketentuan layanan atau pemutusan dilakukan karena pelanggaran yang dilakukan oleh pelanggan.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">8. Cookie & Teknologi Pelacakan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Website dan portal pelanggan kami menggunakan cookie untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Menjaga sesi login Anda tetap aktif</li>
                  <li>Mengingat preferensi tampilan</li>
                  <li>Menganalisis penggunaan website untuk peningkatan layanan</li>
                </ul>
                <p>Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">9. Hubungi Kami</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Jika Anda memiliki pertanyaan atau keluhan mengenai kebijakan privasi ini, silakan hubungi kami melalui:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Halaman kontak di website kami</li>
                  <li>Portal pelanggan (tiket dukungan)</li>
                  <li>WhatsApp customer service</li>
                </ul>
                <p>Kami akan merespon permintaan Anda dalam waktu maksimal 14 hari kerja.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
