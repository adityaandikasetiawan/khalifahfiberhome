"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { api } from "@/lib/api";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  period?: string;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-orange-100 text-orange-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Lunas",
  unpaid: "Belum Bayar",
  pending: "Menunggu",
  overdue: "Jatuh Tempo",
  cancelled: "Dibatalkan",
};

export default function PortalInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("portalAccessToken");
    if (!token) {
      router.push("/portal/login");
      return;
    }

    api
      .get("/portal/invoices")
      .then((res) => {
        const data = res.data.data ?? res.data;
        setInvoices(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        router.push("/portal/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>

        <h1 className="text-2xl font-bold">Tagihan Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Riwayat tagihan dan status pembayaran
        </p>

        {invoices.length === 0 ? (
          <div className="mt-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Belum ada tagihan</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/portal/invoices/${inv.id}`}
                className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-medium">{inv.invoiceNumber}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Jatuh tempo: {new Date(inv.dueDate).toLocaleDateString("id-ID")}
                    {inv.period && ` • Periode: ${inv.period}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    Rp {inv.amount.toLocaleString("id-ID")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
