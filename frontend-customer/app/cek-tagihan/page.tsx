"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Loader2, CheckCircle2, ArrowRight, Wifi, Zap, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { api } from "@/lib/api";

interface InvoiceRow {
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  period?: string;
  packageName?: string;
  payToken: string;
}

export default function CekTagihanPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!q.trim()) {
      setError("Masukkan nomor pelanggan atau nomor HP Anda.");
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const res = await api.get("/pay/lookup", { params: { q: q.trim() } });
      const data = res.data.data ?? res.data;
      if (data.found) {
        setCustomerName(data.customerName ?? "");
        setInvoices(data.invoices ?? []);
      } else {
        setCustomerName("");
        setInvoices([]);
      }
      setSearched(true);
    } catch {
      setError("Gagal memeriksa tagihan. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  const totalTagihan = invoices.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-10 left-[8%] h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-float" />
          <div className="absolute bottom-0 right-[8%] h-56 w-56 rounded-full bg-secondary/10 blur-3xl animate-float-delayed" />
        </div>
        <div className="container relative mx-auto max-w-3xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Cek &amp; Bayar Tagihan
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Cek Tagihan <span className="text-gradient">Tanpa Login</span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Masukkan nomor pelanggan atau nomor HP terdaftar untuk melihat tagihan dan membayar langsung.
            Cepat, mudah, tanpa perlu akun.
          </p>

          {/* Search box */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
            <div className="flex flex-col gap-2 rounded-2xl border bg-card/80 p-2 shadow-xl shadow-primary/5 backdrop-blur sm:flex-row">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="No. Pelanggan (PPPOE-00001) atau 0812xxxxxxxx"
                  className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Cek Tagihan
              </button>
            </div>
            {error && <p className="mx-auto mt-3 max-w-md rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
          </form>

          {/* mini trust row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Aman &amp; terenkripsi</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Bayar instan QRIS/VA</span>
            <span className="inline-flex items-center gap-1.5"><Wifi className="h-4 w-4 text-primary" /> Aktif otomatis</span>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto max-w-2xl px-4">
          {searched && invoices.length === 0 && !error && (
            <div className="rounded-3xl border bg-card p-10 text-center card-hover">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold">Tidak ada tagihan yang belum dibayar 🎉</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Semua tagihan Anda lunas. Jika ini keliru, pastikan nomor pelanggan/HP sudah benar atau
                hubungi tim kami.
              </p>
            </div>
          )}

          {invoices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border bg-gradient-to-r from-primary/5 to-transparent p-5">
                <div>
                  <p className="text-xs text-muted-foreground">Tagihan untuk</p>
                  <p className="font-semibold">{customerName || "Pelanggan"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total {invoices.length} tagihan</p>
                  <p className="text-lg font-bold text-primary">Rp {totalTagihan.toLocaleString("id-ID")}</p>
                </div>
              </div>

              {invoices.map((inv) => (
                <div key={inv.invoiceNumber} className="group rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{inv.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {inv.packageName ?? "-"}{inv.period ? ` · ${inv.period}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Jatuh tempo: {new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${inv.status === "overdue" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                      {inv.status === "overdue" ? "Terlambat" : "Belum Bayar"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-xl font-bold text-primary">Rp {Number(inv.amount).toLocaleString("id-ID")}</span>
                    <button
                      onClick={() => router.push(`/portal/bayar?token=${inv.payToken}`)}
                      className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                    >
                      Bayar Sekarang <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info awal sebelum cari */}
          {!searched && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Search, title: "1. Masukkan Nomor", desc: "Ketik nomor pelanggan atau HP terdaftar Anda." },
                { icon: FileText, title: "2. Lihat Tagihan", desc: "Tagihan yang belum dibayar akan muncul." },
                { icon: Zap, title: "3. Bayar Instan", desc: "Bayar via QRIS/VA/e-wallet, layanan aktif otomatis." },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border bg-card p-5 text-center card-hover">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
