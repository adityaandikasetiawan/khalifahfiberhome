"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wifi, FileText, LifeBuoy, User, LogOut, CreditCard } from "lucide-react";
import { api } from "@/lib/api";

interface Profile {
  id: string;
  name: string;
  customerNumber: string;
  phone: string;
  package?: {
    name: string;
    desc?: string;
  };
  packageName?: string;
  packageDesc?: string;
  activeUntil?: string | null;
  daysRemaining?: number | null;
  subscriptionStatus?: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("portalAccessToken");
    if (!token) {
      router.push("/portal/login");
      return;
    }

    Promise.all([
      api.get("/portal/me").then((res) => res.data.data ?? res.data),
      api.get("/portal/invoices").then((res) => res.data.data ?? res.data),
    ])
      .then(([profileData, invoiceData]) => {
        setProfile(profileData);
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      })
      .catch(() => {
        localStorage.removeItem("portalAccessToken");
        router.push("/portal/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("portalAccessToken");
    router.push("/portal/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeInvoices = invoices.filter(
    (inv) => inv.status === "unpaid" || inv.status === "pending"
  );

  const packageName = profile?.package?.name ?? profile?.packageName ?? "-";
  const packageDesc = profile?.package?.desc ?? profile?.packageDesc ?? "Cocok untuk beberapa perangkat";
  const activeUntil = profile?.activeUntil ?? null;
  const daysRemaining = profile?.daysRemaining ?? null;
  const subStatus = profile?.subscriptionStatus ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Portal Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Portal Pelanggan</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Halo, <strong>{profile?.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Active Package */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paket Aktif</p>
              <p className="font-semibold">{packageName}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Paket</p>
              <p className="font-semibold text-primary">{packageDesc}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Status Layanan</p>
              {subStatus === "suspended" ? (
                <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  Terisolir
                </p>
              ) : subStatus === "active" ? (
                <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Aktif
                </p>
              ) : (
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">-</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Aktif Sampai</p>
              {activeUntil ? (
                <>
                  <p className="mt-0.5 text-sm font-semibold">
                    {new Date(activeUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {daysRemaining !== null && (
                    <p className={`text-xs ${daysRemaining <= 3 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      {daysRemaining > 0 ? `${daysRemaining} hari lagi` : "Sudah lewat masa aktif"}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">Belum ada pembayaran</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Invoices */}
        {activeInvoices.length > 0 && (
          <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-orange-800">
              <CreditCard className="h-5 w-5" />
              Tagihan Aktif
            </h3>
            <div className="mt-4 space-y-3">
              {activeInvoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                  <div>
                    <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Jatuh tempo: {new Date(inv.dueDate).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Rp {inv.amount.toLocaleString("id-ID")}</span>
                    <Link
                      href={`/portal/invoices/${inv.id}`}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Bayar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/portal/invoices"
            className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Tagihan</p>
              <p className="text-xs text-muted-foreground">Riwayat &amp; pembayaran</p>
            </div>
          </Link>
          <Link
            href="/portal/tiket"
            className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <LifeBuoy className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Tiket Support</p>
              <p className="text-xs text-muted-foreground">Lapor gangguan</p>
            </div>
          </Link>
          <Link
            href="/portal/profil"
            className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <User className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Profil</p>
              <p className="text-xs text-muted-foreground">Info pelanggan</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
