import { ShieldCheck, FileText, Building2, Briefcase, Download } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// KBLI yang relevan untuk usaha ISP / jasa internet
const KBLI_LIST = [
  { code: "61100", name: "Aktivitas Telekomunikasi dengan Kabel", desc: "Penyelenggaraan jasa telekomunikasi dan transmisi data melalui jaringan kabel/fiber optic." },
  { code: "61924", name: "Jasa Penyedia Jasa Internet (Internet Service Provider)", desc: "Penyelenggaraan jasa akses internet kepada pelanggan rumah dan usaha." },
  { code: "61300", name: "Aktivitas Telekomunikasi Satelit", desc: "Layanan pendukung transmisi data (jika berlaku)." },
];

export default function LegalitasPage() {
  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Legalitas & Perizinan
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Legalitas Usaha</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khalifah Fiber Home adalah badan usaha resmi dan berizin sesuai peraturan perundang-undangan yang berlaku di Republik Indonesia.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-8">

            {/* Info badan usaha */}
            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">Informasi Badan Usaha</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-muted-foreground mb-1">Nama Usaha</p>
                  <p className="font-semibold">Khalifah Fiber Home</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-muted-foreground mb-1">Bidang Usaha</p>
                  <p className="font-semibold">Jasa Penyedia Internet (ISP)</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4 md:col-span-2">
                  <p className="text-muted-foreground mb-1">Alamat Usaha</p>
                  <p className="font-semibold">Jl. RTA Milono KM. 8 Komplek Asabru 1 No. 6 RT 003/002, Kel. Kereng Bangkirai, Kec. Sabangau, Kota Palangkaraya, Kalimantan Tengah 73111</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-muted-foreground mb-1">NIB (Nomor Induk Berusaha)</p>
                  <p className="font-semibold">Terlampir pada dokumen di bawah</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold text-green-600">Aktif & Berizin</p>
                </div>
              </div>
            </div>

            {/* NIB Documents */}
            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">Dokumen NIB</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Nomor Induk Berusaha (NIB) diterbitkan melalui sistem OSS (Online Single Submission). Berikut adalah dokumen NIB kami dari halaman pertama hingga halaman KBLI:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((page) => (
                  <a
                    key={page}
                    href={`/legal/nib-page-${page}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="aspect-[3/4] bg-muted/40 flex items-center justify-center relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/legal/nib-page-${page}.jpg`}
                        alt={`NIB Halaman ${page}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-muted/40 flex flex-col items-center justify-center text-muted-foreground -z-10">
                        <FileText className="h-8 w-8 mb-2" />
                        <span className="text-xs">NIB Halaman {page}</span>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm font-medium">NIB Halaman {page}</span>
                      <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * Klik pada dokumen untuk melihat versi lengkap. Dokumen NIB (halaman 1 s.d. halaman KBLI) diletakkan di folder <code className="bg-muted px-1 rounded">/public/legal/</code>.
              </p>
            </div>

            {/* KBLI */}
            <div className="rounded-2xl border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">KBLI (Klasifikasi Baku Lapangan Usaha Indonesia)</h2>
              </div>
              <div className="space-y-3">
                {KBLI_LIST.map((kbli) => (
                  <div key={kbli.code} className="flex gap-4 rounded-xl border p-4">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
                        {kbli.code}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{kbli.name}</p>
                      <p className="text-sm text-muted-foreground">{kbli.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
