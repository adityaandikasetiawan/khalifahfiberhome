"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Wifi } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { api } from "@/lib/api";

interface Pkg {
  id: string;
  name: string;
  displayDesc?: string;
  price: number;
  billingCycle: string;
  isActive?: boolean;
}

const CYCLE_LABEL: Record<string, string> = { monthly: "bulan", quarterly: "3 bulan", yearly: "tahun" };

const FALLBACK_PACKAGES: Pkg[] = [
  { id: "1", name: "Home Basic", displayDesc: "Cocok untuk 1-2 perangkat", price: 150000, billingCycle: "monthly" },
  { id: "2", name: "Home Plus", displayDesc: "Cocok untuk beberapa perangkat", price: 250000, billingCycle: "monthly" },
  { id: "3", name: "Home Pro", displayDesc: "Cocok untuk banyak perangkat", price: 300000, billingCycle: "monthly" },
  { id: "4", name: "Home Max", displayDesc: "Cocok untuk keluarga & WFH", price: 400000, billingCycle: "monthly" },
];

export default function PaketPage() {
  const [packages, setPackages] = useState<Pkg[]>(FALLBACK_PACKAGES);

  useEffect(() => {
    // Endpoint publik: mengembalikan kecepatan "display" (up to), bukan rate-limit asli.
    api.get("/registrations/packages").then((res) => {
      if (res.data.data?.length > 0) {
        setPackages(res.data.data);
      }
    }).catch(() => {});
  }, []);

  return (
    <>
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Wifi className="h-4 w-4 text-primary" />
            Fiber Optic Dedicated
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Pilih Paket Internet Anda</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Semua paket sudah termasuk router WiFi gratis, tanpa FUP, dan support teknis 24/7
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, i) => {
              const isMiddle = i === Math.floor(packages.length / 2);
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
                    isMiddle ? "border-primary shadow-xl shadow-primary/10 md:scale-105" : "bg-card hover:border-primary/20"
                  }`}
                >
                  {isMiddle && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Rekomendasi
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground">{pkg.displayDesc ?? "Cocok untuk beberapa perangkat"}</p>
                  </div>
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">Rp {Number(pkg.price).toLocaleString("id-ID")}</span>
                    <span className="text-muted-foreground"> / {CYCLE_LABEL[pkg.billingCycle] ?? pkg.billingCycle}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-primary" /> {pkg.displayDesc ?? "Cocok untuk beberapa perangkat"}</li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-primary" /> Tanpa FUP</li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-primary" /> Free Router WiFi</li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-primary" /> Support 24/7</li>
                  </ul>
                  <Link
                    href={`/daftar?paket=${encodeURIComponent(pkg.name)}`}
                    className={`block w-full rounded-lg py-3 text-center text-sm font-semibold transition-all ${
                      isMiddle
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-primary text-primary hover:bg-primary/5"
                    }`}
                  >
                    Daftar Sekarang
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">Butuh paket khusus untuk usaha atau gedung?</p>
            <Link
              href="/kontak"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-all"
            >
              Hubungi Tim Kami
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
