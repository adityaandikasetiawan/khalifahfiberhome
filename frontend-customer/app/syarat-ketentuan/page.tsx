import { FileText, AlertCircle, CheckCircle, XCircle, Clock, CreditCard, Wifi, Shield } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function SyaratKetentuanPage() {
  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Syarat & Ketentuan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Syarat dan ketentuan layanan internet Khalifah Fiber Home
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
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">1. Ketentuan Umum</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Dengan berlangganan layanan Khalifah Fiber Home, Anda menyetujui seluruh syarat dan ketentuan yang berlaku. Layanan kami meliputi penyediaan akses internet fiber optic untuk keperluan rumah tangga dan usaha.</p>
                <p>Pelanggan wajib berusia minimal 17 tahun atau memiliki persetujuan dari orang tua/wali yang sah untuk dapat berlangganan layanan kami.</p>
                <p>Khalifah Fiber Home berhak mengubah syarat dan ketentuan ini sewaktu-waktu dengan pemberitahuan sebelumnya melalui media komunikasi yang tersedia.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">2. Layanan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Khalifah Fiber Home menyediakan layanan akses internet berbasis fiber optic dengan berbagai pilihan paket kecepatan sesuai kebutuhan pelanggan.</p>
                <p>Kecepatan internet yang tertera pada paket merupakan kecepatan maksimal (up to) dan dapat bervariasi tergantung kondisi jaringan, jumlah pengguna, serta faktor teknis lainnya.</p>
                <p>Kami berkomitmen untuk menjaga uptime jaringan minimal 99% setiap bulannya, kecuali pada kondisi force majeure atau maintenance terjadwal.</p>
                <p>Instalasi perangkat akan dilakukan oleh teknisi resmi Khalifah Fiber Home. Perangkat yang dipinjamkan (ONT/router) tetap menjadi milik perusahaan.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">3. Pembayaran</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Tagihan bulanan diterbitkan setiap awal periode berlangganan dan wajib dilunasi sebelum tanggal jatuh tempo yang tertera pada invoice.</p>
                <p>Pembayaran dapat dilakukan melalui metode yang tersedia di portal pelanggan, termasuk transfer bank dan payment gateway yang telah bekerja sama dengan kami.</p>
                <p>Keterlambatan pembayaran melebihi masa tenggang yang ditentukan akan mengakibatkan isolir (penangguhan layanan) hingga pembayaran dilunasi.</p>
                <p>Biaya instalasi dan aktivasi dikenakan satu kali pada saat pemasangan pertama sesuai paket yang dipilih.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <XCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">4. Larangan Penggunaan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Pelanggan dilarang menggunakan layanan untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Kegiatan yang melanggar hukum Republik Indonesia</li>
                  <li>Menyebarkan konten pornografi, SARA, atau ujaran kebencian</li>
                  <li>Melakukan aktivitas hacking, phishing, atau penyebaran malware</li>
                  <li>Menjual kembali akses internet tanpa izin tertulis dari Khalifah Fiber Home</li>
                  <li>Melakukan aktivitas yang dapat mengganggu kualitas jaringan pengguna lain</li>
                </ul>
                <p>Pelanggaran atas ketentuan di atas dapat mengakibatkan pemutusan layanan secara sepihak tanpa pengembalian dana.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. Pemutusan & Berhenti Berlangganan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Pelanggan dapat mengajukan berhenti berlangganan dengan memberikan pemberitahuan minimal 7 (tujuh) hari kerja sebelum periode tagihan berikutnya.</p>
                <p>Seluruh perangkat pinjaman (ONT/router) wajib dikembalikan dalam kondisi baik. Kerusakan atau kehilangan perangkat akan dikenakan biaya penggantian.</p>
                <p>Tagihan yang belum dilunasi tetap menjadi kewajiban pelanggan meskipun layanan telah dihentikan.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">6. Batasan Tanggung Jawab</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Khalifah Fiber Home tidak bertanggung jawab atas kerugian yang timbul akibat:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gangguan layanan akibat force majeure (bencana alam, kebakaran, banjir, dll)</li>
                  <li>Maintenance terjadwal yang telah diberitahukan sebelumnya</li>
                  <li>Kerusakan perangkat milik pelanggan</li>
                  <li>Penggunaan layanan yang tidak sesuai ketentuan</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">7. Penyelesaian Sengketa</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Setiap perselisihan yang timbul akan diselesaikan secara musyawarah mufakat antara kedua belah pihak.</p>
                <p>Apabila musyawarah tidak tercapai, maka penyelesaian akan dilakukan melalui jalur hukum yang berlaku di wilayah Republik Indonesia.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
