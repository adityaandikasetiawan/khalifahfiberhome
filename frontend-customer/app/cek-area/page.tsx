"use client";

import { useState } from "react";
import { MapPin, CheckCircle, XCircle, Search } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";

export default function CekAreaPage() {
  const [address, setAddress] = useState("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulasi pengecekan (nanti bisa dihubungkan ke ODP API)
    setTimeout(() => {
      setChecked(true);
      setLoading(false);
    }, 1500);
  }

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <MapPin className="h-4 w-4 text-primary" />
            Cek Ketersediaan
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Cek Area Layanan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Masukkan alamat atau kecamatan Anda untuk memastikan area Anda sudah terjangkau jaringan fiber kami
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-xl px-4">
          <form onSubmit={handleCheck} className="rounded-2xl border bg-card p-8 shadow-sm">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Alamat / Kecamatan / Kelurahan</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setChecked(false); }}
                  placeholder="Contoh: Kecamatan Genteng, Banyuwangi"
                  className="w-full rounded-lg border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? "Mengecek..." : "Cek Ketersediaan"}
            </button>
          </form>

          {checked && (
            <div className="mt-8 rounded-2xl border p-8 text-center bg-card">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-2">Area Anda Terjangkau! ✓</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Selamat! Lokasi <strong>"{address}"</strong> terjangkau jaringan Khalifah Fiber Home. Hubungi kami untuk proses pemasangan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20berlangganan.%20Area%20saya:%20${encodeURIComponent(address)}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Daftar via WhatsApp
                </Link>
                <Link
                  href="/paket"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
                >
                  Lihat Paket
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
