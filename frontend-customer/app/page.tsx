"use client";

import Link from "next/link";
import { Wifi, Zap, Shield, Headphones, CheckCircle, ArrowRight, Star, ChevronDown, ChevronLeft, ChevronRight, Globe, Clock, Users } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useState, useEffect, useCallback } from "react";
import { FloatingShapes, TrustBadges, WaveDivider, NetworkLines, SpeedLines } from "@/components/decorations";
import { HERO_ILLUSTRATIONS } from "@/components/hero-illustrations";

const HERO_SLIDES = [
  {
    badge: "Internet Fiber Optic",
    title: "Internet",
    highlight: "Cepat & Stabil",
    subtitle: "Tanpa Batas",
    desc: "Khalifah Fiber Home menyediakan layanan internet fiber optic berkualitas tinggi dengan harga terjangkau.",
    cta: { text: "Daftar Sekarang", href: "/daftar" },
    ctaSecondary: { text: "Lihat Paket", href: "/paket" },
    bg: "from-primary/5 via-background to-accent/30",
    stat: { value: "∞", unit: "", label: "Cocok Banyak Perangkat" },
  },
  {
    badge: "Promo Spesial",
    title: "Gratis",
    highlight: "Instalasi",
    subtitle: "Untuk Pelanggan Baru",
    desc: "Daftar sekarang dan nikmati pemasangan gratis* serta router WiFi gratis untuk paket Home 20 ke atas.",
    cta: { text: "Daftar Sekarang", href: "/daftar" },
    ctaSecondary: { text: "Cek Area", href: "/cek-area" },
    bg: "from-secondary/5 via-background to-primary/10",
    stat: { value: "0", unit: "Rp", label: "Biaya Instalasi*" },
  },
  {
    badge: "Tanpa FUP",
    title: "Unlimited",
    highlight: "Tanpa Batas",
    subtitle: "Sepuasnya 24/7",
    desc: "Streaming, gaming, video call, dan download sepuasnya tanpa kuota. Koneksi stabil 24 jam nonstop.",
    cta: { text: "Pilih Paket", href: "/paket" },
    ctaSecondary: { text: "FAQ", href: "/faq" },
    bg: "from-blue-50 via-background to-primary/5",
    stat: { value: "∞", unit: "", label: "Unlimited Data" },
  },
];

const FEATURES = [
  { icon: Zap, title: "Kecepatan Tinggi", desc: "Koneksi fiber optic ngebut langsung ke rumah, cocok untuk banyak perangkat sekaligus" },
  { icon: Shield, title: "Stabil 24/7", desc: "Uptime 99.9% dengan backup link dan monitoring jaringan real-time" },
  { icon: Headphones, title: "Support Responsif", desc: "Tim teknis profesional siap membantu kapan saja via WhatsApp" },
  { icon: Globe, title: "Coverage Luas", desc: "Jaringan fiber optic terus berkembang menjangkau lebih banyak area" },
  { icon: Clock, title: "Pemasangan Cepat", desc: "Proses instalasi selesai dalam 1-3 hari kerja setelah survey" },
  { icon: Users, title: "Tanpa FUP", desc: "Nikmati internet tanpa batas kuota, bebas streaming dan gaming sepuasnya" },
];

const PACKAGES = [
  { name: "Home Basic", desc: "Cocok untuk 1-2 perangkat", price: 150000, popular: false, features: ["Cocok untuk 1-2 perangkat", "Tanpa FUP", "Free Router WiFi", "Support 24/7"] },
  { name: "Home Plus", desc: "Cocok untuk beberapa perangkat", price: 250000, popular: true, features: ["Cocok untuk beberapa perangkat", "Tanpa FUP", "Free Router WiFi", "Support 24/7", "Priority Support"] },
  { name: "Home Pro", desc: "Cocok untuk banyak perangkat", price: 400000, popular: false, features: ["Cocok untuk banyak perangkat & WFH", "Tanpa FUP", "Free Dual-Band Router", "Support 24/7", "Priority Support"] },
];

const STEPS = [
  { step: "1", title: "Cek Area", desc: "Pastikan lokasi Anda terjangkau jaringan fiber kami", color: "from-green-400 to-emerald-600" },
  { step: "2", title: "Pilih Paket", desc: "Pilih paket internet sesuai kebutuhan dan budget", color: "from-blue-400 to-indigo-600" },
  { step: "3", title: "Pemasangan", desc: "Tim teknisi kami datang dan memasang dalam 1-3 hari", color: "from-amber-400 to-orange-600" },
];

const TESTIMONIALS = [
  { name: "Budi Santoso", role: "Pelanggan Home 20", text: "Sudah 2 tahun pakai Khalifah Fiber, koneksi stabil jarang gangguan. Support-nya juga fast response.", avatar: "BS" },
  { name: "Siti Rahayu", role: "Pelanggan Home 50", text: "Akhirnya nemu ISP yang bener-bener dedicated. Streaming 4K lancar, gaming tanpa lag.", avatar: "SR" },
  { name: "Ahmad Fauzi", role: "Pelanggan Home 10", text: "Harga terjangkau tapi kualitas oke. Pemasangan juga cepat, tidak sampai 2 hari sudah bisa dipakai.", avatar: "AF" },
];

const FAQS = [
  { q: "Berapa lama proses pemasangan?", a: "Setelah survey area, pemasangan biasanya selesai dalam 1-3 hari kerja." },
  { q: "Apakah ada biaya pemasangan?", a: "Biaya pemasangan tergantung jarak titik ODP ke rumah Anda. Tim kami akan menginformasikan saat survey." },
  { q: "Bagaimana jika terjadi gangguan?", a: "Anda bisa lapor langsung via portal pelanggan atau WhatsApp. Tim teknis kami siap 24/7." },
  { q: "Apakah ada kontrak minimum?", a: "Tidak ada kontrak minimum. Anda bisa berlangganan bulanan dan berhenti kapan saja." },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <>
      <Navbar />

      {/* Hero Slider */}
      <section className="relative overflow-hidden min-h-[82vh] flex items-center">
        {/* Animated background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-1000`} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-primary/8 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-[10%] h-56 w-56 rounded-full bg-secondary/10 blur-3xl animate-float-delayed" />
        </div>

        {/* Slide content */}
        <div className="container mx-auto max-w-6xl px-4 py-14 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div key={currentSlide} className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-muted-foreground mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {slide.badge}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                {slide.title}{" "}
                <span className="text-gradient">{slide.highlight}</span>
                <br />{slide.subtitle}
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
                {slide.desc}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={slide.cta.href}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 btn-shine"
                >
                  {slide.cta.text} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={slide.ctaSecondary.href}
                  className="inline-flex items-center justify-center gap-2 rounded-xl glass px-7 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  {slide.ctaSecondary.text}
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["BS", "SR", "AF", "WI"].map((name, i) => (
                    <div key={i} className="h-9 w-9 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-xs font-bold text-primary">
                      {name}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">500+ pelanggan aktif</p>
                </div>
              </div>
            </div>

            {/* Right side - Hero illustration (dynamic per slide) */}
            <div className="hidden lg:flex justify-center items-center animate-fade-in" key={`illus-${currentSlide}`}>
              {(() => {
                const Illustration = HERO_ILLUSTRATIONS[currentSlide % HERO_ILLUSTRATIONS.length];
                return <Illustration />;
              })()}
            </div>
          </div>

          {/* Slider controls */}
          <div className="flex items-center justify-between mt-12">
            <div className="flex gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentSlide ? "w-8 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-primary/25 hover:bg-primary/50"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                className="h-10 w-10 rounded-full border bg-white/80 hover:bg-white flex items-center justify-center transition-all hover:shadow-md"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextSlide}
                className="h-10 w-10 rounded-full border bg-white/80 hover:bg-white flex items-center justify-center transition-all hover:shadow-md"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Trust badges */}
      <div className="border-y bg-white/50">
        <div className="container mx-auto max-w-6xl px-4">
          <TrustBadges />
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 relative overflow-hidden">
        <FloatingShapes />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-10 animate-slide-up">
            <p className="text-sm font-semibold text-primary mb-3 tracking-wider uppercase">Kenapa Kami?</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Keunggulan Khalifah Fiber Home</h2>
            <p className="text-muted-foreground">Kami berkomitmen memberikan layanan internet terbaik dengan jaringan fiber optic modern</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="group rounded-2xl border bg-card p-7 card-hover">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <WaveDivider color="hsl(var(--muted) / 0.3)" />
      <section className="py-16 bg-muted/30 relative">
        <NetworkLines />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold text-primary mb-3 tracking-wider uppercase">Langkah Mudah</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cara Berlangganan</h2>
            <p className="text-muted-foreground">Hanya 3 langkah mudah untuk menikmati internet fiber optic di rumah Anda</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-green-300 via-blue-300 to-amber-300 opacity-40" />

            {STEPS.map((s, i) => (
              <div key={i} className="text-center group relative">
                <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  {s.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/daftar"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 duration-300"
            >
              Mulai Berlangganan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing / Paket */}
      <section className="py-16 relative overflow-hidden">
        <SpeedLines />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold text-primary mb-3 tracking-wider uppercase">Pilih Paket</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Paket Internet</h2>
            <p className="text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan Anda. Semua paket sudah termasuk router WiFi gratis.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {PACKAGES.map((pkg, i) => (
              <div key={i} className={`relative rounded-2xl border p-7 transition-all duration-300 card-hover ${pkg.popular ? "border-primary shadow-xl shadow-primary/10 md:scale-105 bg-gradient-to-b from-primary/3 to-transparent" : "bg-card"}`}>
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25">
                    Paling Populer
                  </div>
                )}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.desc}</p>
                </div>
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-muted-foreground">Rp</span>
                    <span className="text-4xl font-bold">{(pkg.price / 1000).toFixed(0)}</span>
                    <span className="text-lg font-bold">rb</span>
                  </div>
                  <span className="text-sm text-muted-foreground">/ bulan</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/daftar?paket=${encodeURIComponent(pkg.name)}`}
                  className={`block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
                    pkg.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl btn-shine"
                      : "border-2 border-primary/20 text-primary hover:border-primary hover:bg-primary/5"
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
      <WaveDivider color="hsl(var(--muted) / 0.3)" />
      <section className="py-16 bg-muted/30 relative">
        <FloatingShapes />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold text-primary mb-3 tracking-wider uppercase">Testimoni</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Apa Kata Pelanggan Kami</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border bg-card p-7 card-hover">
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary mb-3 tracking-wider uppercase">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border bg-card overflow-hidden transition-all duration-200 hover:border-primary/20">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold hover:bg-muted/50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-5 pb-5 text-sm text-muted-foreground">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-sm font-medium text-primary hover:underline">
              Lihat semua FAQ →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 md:p-16 text-primary-foreground overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Menikmati Internet Cepat?</h2>
              <p className="text-primary-foreground/80 mb-8 text-lg">
                Daftar sekarang dan nikmati internet fiber optic berkualitas tinggi. Pemasangan cepat, tanpa ribet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/daftar"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-primary hover:bg-white/90 transition-all shadow-xl hover:-translate-y-0.5 duration-300"
                >
                  Daftar Sekarang <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/cek-area"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-all duration-300"
                >
                  Cek Area Anda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
