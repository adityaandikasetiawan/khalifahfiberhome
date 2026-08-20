"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { portalApi } from "@/lib/portal-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Profile {
  id: string;
  name: string;
  customerNumber: string;
  subscriptions: { package: { name: string; speedMbps: number } }[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  status: string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "paid": return "success";
    case "unpaid": return "warning";
    case "overdue": return "danger";
    default: return "secondary";
  }
};

export default function PortalDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!localStorage.getItem("portalAccessToken")) {
      router.push("/portal/login");
      return;
    }
    portalApi.get("/portal/me").then((res) => setProfile(res.data.data));
    portalApi.get("/portal/invoices").then((res) => setInvoices(res.data.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem("portalAccessToken");
    router.push("/portal/login");
  }

  const activeInvoice = invoices.find((inv) => inv.status === "unpaid" || inv.status === "overdue");

  return (
    <main className="mx-auto min-h-screen max-w-md bg-muted/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Halo,</p>
          <p className="font-semibold">{profile?.name ?? "..."}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>Keluar</Button>
      </div>

      {profile && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-sm text-emerald-700">
            <p>No. Pelanggan: {profile.customerNumber}</p>
            {profile.subscriptions?.[0] && (
              <p>Paket: {profile.subscriptions[0].package.name} ({profile.subscriptions[0].package.speedMbps} Mbps)</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeInvoice ? (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">Tagihan Aktif</p>
            <p className="text-lg font-semibold text-amber-900">
              Rp {Number(activeInvoice.totalAmount).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-amber-700">
              Jatuh tempo: {new Date(activeInvoice.dueDate).toLocaleDateString("id-ID")}
            </p>
            <Button asChild className="mt-3 w-full">
              <Link href={`/portal/invoices/${activeInvoice.id}`}>Bayar Sekarang</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-4">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            Tidak ada tagihan aktif. Semua tagihan sudah lunas.
          </CardContent>
        </Card>
      )}

      <p className="mb-2 text-sm font-medium">Riwayat Tagihan</p>
      <div className="space-y-2">
        {invoices.map((inv) => (
          <Link key={inv.id} href={`/portal/invoices/${inv.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.dueDate).toLocaleDateString("id-ID")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</p>
                  <Badge variant={statusVariant(inv.status) as any}>{inv.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {invoices.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada riwayat tagihan</p>
        )}
      </div>
    </main>
  );
}
