import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 relative overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Khalifah Fiber Home" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Layanan internet fiber optic cepat, stabil, dan terjangkau untuk rumah dan usaha Anda.
            </p>
            <Link
              href="/daftar"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all"
            >
              Daftar Sekarang <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Layanan</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <Link href="/paket" className="block hover:text-primary transition-colors">Paket Internet</Link>
              <Link href="/cek-area" className="block hover:text-primary transition-colors">Cek Area</Link>
              <Link href="/daftar" className="block hover:text-primary transition-colors">Daftar Berlangganan</Link>
              <Link href="/portal/login" className="block hover:text-primary transition-colors">Portal Pelanggan</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Informasi</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <Link href="/tentang" className="block hover:text-primary transition-colors">Tentang Kami</Link>
              <Link href="/faq" className="block hover:text-primary transition-colors">FAQ</Link>
              <Link href="/kontak" className="block hover:text-primary transition-colors">Hubungi Kami</Link>
              <Link href="/legalitas" className="block hover:text-primary transition-colors">Legalitas (NIB & KBLI)</Link>
              <Link href="/syarat-ketentuan" className="block hover:text-primary transition-colors">Syarat & Ketentuan</Link>
              <Link href="/kebijakan-privasi" className="block hover:text-primary transition-colors">Kebijakan Privasi</Link>
              <Link href="/kebijakan-refund" className="block hover:text-primary transition-colors">Kebijakan Refund</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Kontak</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Jl. RTA Milono KM. 8 Komplek Asabru 1 No. 6 RT 003/002, Kel. Kereng Bangkirai, Kec. Sabangau, Kota Palangkaraya, Kalimantan Tengah 73111</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="https://wa.me/6282128052229" className="hover:text-primary transition-colors">0821-2805-2229</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@khalifahfiberhome.id" className="hover:text-primary transition-colors">info@khalifahfiberhome.id</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 Khalifah Fiber Home. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            <Link href="/syarat-ketentuan" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link>
            <Link href="/kebijakan-privasi" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
            <Link href="/kebijakan-refund" className="hover:text-primary transition-colors">Refund</Link>
            <Link href="/legalitas" className="hover:text-primary transition-colors">Legalitas</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
