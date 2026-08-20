import { Wifi, MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary">Khalifah Fiber Home</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Layanan internet fiber optic cepat, stabil, dan terjangkau untuk rumah dan usaha Anda.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Tautan</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link href="/paket" className="block hover:text-primary">Paket Internet</Link>
              <Link href="/cek-area" className="block hover:text-primary">Cek Area</Link>
              <Link href="/portal/login" className="block hover:text-primary">Portal Pelanggan</Link>
              <Link href="/kontak" className="block hover:text-primary">Hubungi Kami</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Kontak</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Jl. Fiber Optic No. 1, Indonesia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="https://wa.me/6281234567890" className="hover:text-primary">0812-3456-7890</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@khalifahfiberhome.id" className="hover:text-primary">info@khalifahfiberhome.id</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © 2026 Khalifah Fiber Home. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
