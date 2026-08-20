"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, MessageCircle, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";

export default function KontakPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "", paket: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Hubungi Kami</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tim kami siap membantu Anda. Hubungi melalui WhatsApp atau isi form di bawah.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-4">
              <Link
                href="https://wa.me/6281234567890?text=Halo%20Khalifah%20Fiber%20Home"
                target="_blank"
                className="flex items-start gap-4 rounded-2xl border bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">0812-3456-7890</p>
                  <p className="text-xs text-green-600 mt-1">Respon cepat, chat sekarang →</p>
                </div>
              </Link>

              <div className="flex items-start gap-4 rounded-2xl border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Telepon</p>
                  <p className="text-sm text-muted-foreground">0812-3456-7890</p>
                  <p className="text-xs text-muted-foreground mt-1">Senin - Sabtu, 08:00 - 21:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 flex-shrink-0">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <p className="text-sm text-muted-foreground">info@khalifahfiberhome.id</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Kantor</p>
                  <p className="text-sm text-muted-foreground">Jl. Fiber Optic No. 1, Indonesia</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="rounded-2xl border bg-card p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Terima Kasih!</h3>
                  <p className="text-muted-foreground">Kami akan segera menghubungi Anda dalam waktu 1x24 jam.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-8">
                  <h3 className="text-lg font-bold mb-6">Kirim Pesan</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Nama Anda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">No. WhatsApp / HP</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Paket yang Diminati</label>
                      <select
                        value={form.paket}
                        onChange={(e) => setForm({ ...form, paket: e.target.value })}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">-- Pilih Paket --</option>
                        <option value="Home 10 (10Mbps)">Home 10 (10 Mbps)</option>
                        <option value="Home 20 (20Mbps)">Home 20 (20 Mbps)</option>
                        <option value="Home 50 (50Mbps)">Home 50 (50 Mbps)</option>
                        <option value="Home 100 (100Mbps)">Home 100 (100 Mbps)</option>
                        <option value="Belum tahu">Belum tahu, mau konsultasi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Pesan (opsional)</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        rows={4}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        placeholder="Alamat pemasangan, pertanyaan, dll..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Kirim Pesan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
