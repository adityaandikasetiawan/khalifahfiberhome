"use client";

import Link from "next/link";
import { Wifi, Zap, Shield, Headphones, CheckCircle, ArrowRight, Star, ChevronDown, Globe, Clock, Users } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroIllustration, FiberIllustration, SpeedMeter } from "@/components/illustrations";
import { useState } from "react";

const FEATURES = [
  { icon: Zap, title: "Kecepatan Tinggi", desc: "Bandwidth dedicated hingga 100Mbps dengan fiber optic langsung ke rumah Anda" },
  { icon: Shield, title: "Stabil 24/7", desc: "Uptime 99.9% dengan backup link dan monitoring jaringan real-time" },
  { icon: Headphones, title: "Support Responsif", desc: "Tim teknis profesional siap membantu kapan saja via WhatsApp" },
  { icon: Globe, title: "Coverage Luas", desc: "Jaringan fiber optic terus berkembang menjangkau lebih banyak area" },
  { icon: Clock, title: "Pemasangan Cepat", desc: "Proses instalasi selesai dalam 1-3 hari kerja setelah survey" },
  { icon: Users, title: "Tanpa FUP", desc: "Nikmati internet tanpa batas kuota, bebas streaming dan gaming sepuasnya" },
];

const PACKAGES = [
  { name: "Home 10", speed: 10, price: 150000, popular: false, features: ["10 Mbps Dedicated", "Tanpa FUP", "Free Router WiFi", "Support 24/7"] },
  { name: "Home 20", speed: 20, price: 250000, popular: true, features: ["20 Mbps Dedicated", "Tanpa FUP", "Free Router WiFi", "Support 24/7", "Priority Support"] },
  { name: "Home 50", speed: 50, price: 400000, popular: false, features: ["50 Mbps Dedicated", "Tanpa FUP", "Free Dual-Band Router", "Support 24/7", "Priority Support", "Free IP Static"] },
];

const STEPS = [
  { step: "01", title: "Cek Area", desc: "Pastikan lokasi Anda terjangkau jaringan fiber kami" },
  { step: "02", title: "Pilih Paket", desc: "Pilih paket internet sesuai kebutuhan dan budget" },
  { step: "03", title: "Pemasangan", desc: "Tim teknisi kami akan datang dan memasang dalam 1-3 hari" },
];

const TESTIMONIALS = [
  { name: "Budi Santoso", role: "Pelanggan Home 20", text: "Sudah 2 tahun pakai Khalifah Fiber, koneksi stabil jarang gangguan. Support-nya juga fast response." },
  { name: "Siti Rahayu", role: "Pelanggan Home 50", text: "Akhirnya nemu ISP yang bener-bener dedicated. Streaming 4K lancar, gaming tanpa lag." },
  { name: "Ahmad Fauzi", role: "Pelanggan Home 10", text: "Harga terjangkau tapi kualitas oke. Pemasangan juga cepat, tidak sampai 2 hari sudah bisa dipakai." },
];

const FAQS = [
  { q: "Berapa lama proses pemasangan?", a: "Setelah survey area, pemasangan biasanya selesai dalam 1-3 hari kerja." },
  { q: "Apakah ada biaya pemasangan?", a: "Biaya pemasangan tergantung jarak titik ODP ke rumah Anda. Tim kami akan menginformasikan saat survey." },
  { q: "Bagaimana jika terjadi gangguan?", a: "Anda bisa lapor langsung via portal pelanggan atau WhatsApp. Tim teknis kami siap 24/7." },
  { q: "Apakah ada kontrak minimum?", a: "Tidak ada kontrak minimum. Anda bisa berlangganan bulanan dan berhenti kapan saja." },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 py-20 lg:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground mb-6">
                <Wifi className="h-4 w-4 text-primary" />
                Internet Fiber Optic untuk Rumah Anda
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Internet <span className="text-primary">Cepat & Stabil</span> Tanpa Batas
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Khalifah Fiber Home menyediakan layanan internet fiber optic berkualitas tinggi dengan harga terjangkau. Nikmati streaming, gaming, dan kerja dari rumah tanpa hambatan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/paket"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                >
                  Lihat Paket <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/portal/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
                >
                  Portal Pelanggan
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <HeroIllustration />
            </div>
          </div>
        </div>
        {/* Decorative gradient blobs */}
        <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary mb-2">KENAPA KAMI?</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Keunggulan Khalifah Fiber Home</h2>
            <p className="text-muted-foreground">Kami berkomitmen memberikan layanan internet terbaik dengan jaringan fiber optic modern</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="group rounded-2xl border bg-card p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300" style={{ perspective: "800px" }}>
                <div className="group-hover:translate-z-4 transition-transform duration-300" style={{ transform: "translateZ(0)", transition: "transform 0.3s" }}>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-sm font-semibold text-primary mb-2">LANGKAH MUDAH</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cara Berlangganan</h2>
            <p className="text-muted-foreground">Hanya 3 langkah mudah untuk menikmati internet fiber optic di rumah Anda</p>
          </div>
          
          {/* Fiber animation */}
          <div className="mb-12">
            <FiberIllustration />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Paket */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary mb-2">PILIH PAKET</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Paket Internet</h2>
            <p className="text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan Anda. Semua paket sudah termasuk router WiFi gratis.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3" style={{ perspective: "1200px" }}>
            {PACKAGES.map((pkg, i) => (
              <div key={i} className={`relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${pkg.popular ? "border-primary shadow-xl shadow-primary/10 scale-105" : "bg-card hover:border-primary/20"}`} style={{ transformStyle: "preserve-3d" }}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Paling Populer 🔥
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.speed} Mbps Dedicated</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">Rp {(pkg.price / 1000).toFixed(0)}rb</span>
                  <span className="text-muted-foreground"> / bulan</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`https://wa.me/6281234567890?text=Saya%20tertarik%20paket%20${pkg.name}%20${pkg.speed}Mbps`}
                  target="_blank"
                  className={`block w-full rounded-lg py-3 text-center text-sm font-semibold transition-all ${
                    pkg.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                      : "border border-primary text-primary hover:bg-primary/5"
                  }`}
                >
                  Berlangganan Sekarang
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary mb-2">TESTIMONI</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Apa Kata Pelanggan Kami</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-2">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold hover:bg-muted/50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-10 md:p-16 text-primary-foreground">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Menikmati Internet Cepat?</h2>
                <p className="text-primary-foreground/80 mb-8 max-w-xl">
                  Daftar sekarang dan nikmati internet fiber optic berkualitas tinggi. Pemasangan cepat, tanpa ribet.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="https://wa.me/6281234567890?text=Halo,%20saya%20tertarik%20berlangganan%20Khalifah%20Fiber%20Home"
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90 transition-all"
                  >
                    Hubungi via WhatsApp
                  </Link>
                  <Link
                    href="/cek-area"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    Cek Area Anda
                  </Link>
                </div>
              </div>
              <div className="hidden lg:flex justify-center">
                <SpeedMeter speed={100} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
