import { RotateCcw, CheckCircle, XCircle, Clock, CreditCard, AlertCircle, FileText, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function KebijakanRefundPage() {
  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <RotateCcw className="h-4 w-4 text-primary" />
            Kebijakan Pengembalian Dana
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Kebijakan Refund</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ketentuan pengembalian dana (refund) layanan internet Khalifah Fiber Home
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
                <p>Khalifah Fiber Home berkomitmen memberikan layanan terbaik kepada seluruh pelanggan. Kebijakan pengembalian dana (refund) ini mengatur ketentuan dan prosedur pengembalian dana atas pembayaran layanan internet yang telah dilakukan.</p>
                <p>Dengan melakukan pembayaran, pelanggan dianggap telah membaca, memahami, dan menyetujui kebijakan refund ini.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">2. Kondisi yang Dapat Direfund</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Pengembalian dana dapat diajukan pada kondisi berikut:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Pembayaran ganda (double payment):</strong> Jika terjadi pembayaran lebih dari satu kali untuk tagihan yang sama, kelebihan pembayaran akan dikembalikan 100%.</li>
                  <li><strong>Gagal instalasi:</strong> Jika layanan tidak dapat dipasang karena kendala teknis dari pihak kami (area ternyata tidak terjangkau setelah survey), biaya yang telah dibayarkan akan dikembalikan penuh.</li>
                  <li><strong>Downtime berkepanjangan:</strong> Jika terjadi gangguan layanan lebih dari 7 hari berturut-turut yang disebabkan oleh pihak kami (bukan force majeure), pelanggan berhak atas pengembalian dana proporsional untuk periode yang terdampak.</li>
                  <li><strong>Pembayaran di muka:</strong> Untuk pembayaran beberapa bulan di muka, sisa periode yang belum terpakai dapat dikembalikan secara proporsional (prorata) jika pelanggan berhenti berlangganan.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">3. Kondisi yang Tidak Dapat Direfund</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Pengembalian dana TIDAK berlaku pada kondisi berikut:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Biaya instalasi yang sudah selesai dilakukan (perangkat sudah terpasang dan layanan aktif).</li>
                  <li>Layanan telah digunakan secara normal selama periode berlangganan berjalan.</li>
                  <li>Gangguan yang disebabkan oleh force majeure (bencana alam, kebakaran, banjir, pemadaman listrik massal, dll).</li>
                  <li>Pemutusan layanan akibat pelanggaran Syarat & Ketentuan oleh pelanggan.</li>
                  <li>Kerusakan perangkat yang disebabkan oleh kelalaian pelanggan.</li>
                  <li>Permintaan refund yang diajukan setelah lebih dari 30 hari sejak tanggal pembayaran.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">4. Prosedur Pengajuan Refund</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Untuk mengajukan pengembalian dana, ikuti langkah berikut:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Ajukan permohonan refund melalui portal pelanggan (menu Tiket) atau hubungi customer service kami di WhatsApp 0821-2805-2229.</li>
                  <li>Sertakan bukti pembayaran, nomor invoice, dan alasan pengajuan refund.</li>
                  <li>Tim kami akan memverifikasi permohonan dalam waktu 3-5 hari kerja.</li>
                  <li>Jika disetujui, dana akan dikembalikan melalui transfer bank ke rekening yang terdaftar atas nama pelanggan.</li>
                  <li>Proses pengembalian dana memakan waktu 7-14 hari kerja setelah permohonan disetujui.</li>
                </ol>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. Metode Pengembalian Dana</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Pengembalian dana dilakukan melalui:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Transfer bank</strong> ke rekening yang terdaftar atas nama pelanggan.</li>
                  <li>Untuk pembayaran melalui payment gateway (iPaymu), pengembalian dapat diproses melalui kanal yang sama sesuai ketentuan penyedia pembayaran.</li>
                </ul>
                <p>Seluruh biaya administrasi transfer (jika ada) akan ditanggung oleh Khalifah Fiber Home, kecuali refund disebabkan oleh kesalahan data rekening dari pelanggan.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">6. Ketentuan Tambahan</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Khalifah Fiber Home berhak menolak permohonan refund yang tidak memenuhi ketentuan di atas atau yang terindikasi penyalahgunaan.</p>
                <p>Kebijakan refund ini dapat berubah sewaktu-waktu dengan pemberitahuan melalui website atau media komunikasi resmi kami.</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-primary/5 border-primary/20 p-8 text-center">
              <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Butuh Bantuan?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Hubungi customer service kami untuk pertanyaan seputar pengembalian dana.
              </p>
              <a
                href="https://wa.me/6282128052229?text=Halo,%20saya%20ingin%20menanyakan%20tentang%20refund"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Hubungi WhatsApp: 0821-2805-2229
              </a>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
