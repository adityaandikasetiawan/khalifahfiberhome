import { Wifi, Target, Heart, Users, Globe } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TentangPage() {
  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Tentang Khalifah Fiber Home</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Penyedia layanan internet fiber optic terpercaya untuk rumah dan usaha Anda
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="prose prose-lg max-w-none">
            <div className="rounded-2xl border bg-card p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">Siapa Kami</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Khalifah Fiber Home adalah penyedia layanan internet fiber optic yang berfokus pada kebutuhan rumah tangga dan UMKM. 
                Kami hadir dengan semangat memberikan koneksi internet yang cepat, stabil, dan terjangkau untuk masyarakat. 
                Dengan infrastruktur jaringan fiber optic modern dan tim teknis profesional, kami berkomitmen menghadirkan 
                pengalaman internet terbaik bagi seluruh pelanggan.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold m-0">Visi</h2>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Menjadi penyedia internet fiber optic terpercaya dan terdepan, yang mengutamakan kualitas 
                  layanan dan kepuasan pelanggan di setiap area yang kami jangkau.
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold m-0">Misi</h2>
                </div>
                <ul className="text-muted-foreground text-sm space-y-2 leading-relaxed">
                  <li>• Menyediakan koneksi internet cepat dan stabil dengan harga terjangkau</li>
                  <li>• Memberikan layanan pelanggan yang responsif dan profesional</li>
                  <li>• Terus memperluas jangkauan jaringan fiber optic</li>
                  <li>• Mendukung produktivitas digital masyarakat</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border bg-card p-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Pelanggan Aktif</p>
              </div>
              <div className="rounded-2xl border bg-card p-6 text-center">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-primary">99.9%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div className="rounded-2xl border bg-card p-6 text-center">
                <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-primary">4.8/5</p>
                <p className="text-sm text-muted-foreground">Rating Pelanggan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
