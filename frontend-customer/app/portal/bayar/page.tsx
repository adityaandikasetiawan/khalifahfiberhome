"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Loader2, XCircle } from "lucide-react";
import { api } from "@/lib/api";

interface InvoiceItem { description: string; amount: number; }
interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  period?: string;
  items?: InvoiceItem[];
  customerName?: string;
  packageName?: string;
}

// Rekening resmi tujuan transfer manual (a/n Purwo Budi Sunaryono).
const BANK_ACCOUNT_NAME = "Purwo Budi Sunaryono";
const BANK_ACCOUNTS = [
  { bank: "BRI", accountNo: "454001025033539" },
  { bank: "SeaBank", accountNo: "901370540964" },
];
// Nomor WhatsApp admin untuk kirim bukti transfer (konsisten dgn kontak portal).
const ADMIN_WA = "6282128052229";

function BayarInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copiedAcc, setCopiedAcc] = useState("");

  useEffect(() => {
    if (!token) {
      setLoadError("Tautan pembayaran tidak valid.");
      setLoading(false);
      return;
    }
    api
      .get(`/pay/${token}`)
      .then((res) => setInvoice(res.data.data ?? res.data))
      .catch((err) => setLoadError(err?.response?.data?.message ?? "Tautan pembayaran tidak valid atau kedaluwarsa."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCopy = (accountNo: string) => {
    navigator.clipboard?.writeText(accountNo);
    setCopiedAcc(accountNo);
    setTimeout(() => setCopiedAcc(""), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError || !invoice) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-lg font-bold">Tautan Tidak Valid</h1>
          <p className="mt-1 text-sm text-muted-foreground">{loadError || "Tagihan tidak ditemukan."}</p>
        </div>
      </main>
    );
  }

  const isPaid = invoice.status === "paid";
  const nominal = `Rp ${invoice.amount.toLocaleString("id-ID")}`;
  const waMessage = encodeURIComponent(
    `Halo admin, saya sudah transfer untuk tagihan ${invoice.invoiceNumber} sebesar ${nominal}. Berikut bukti transfernya.`,
  );
  const waLink = `https://wa.me/${ADMIN_WA}?text=${waMessage}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-[10%] h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-[10%] h-56 w-56 rounded-full bg-secondary/10 blur-3xl animate-float-delayed" />
      </div>
      <div className="container relative mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Khalifah Fiber Home" className="h-11 w-auto object-contain" />
          <div className="border-l pl-3">
            <p className="text-xs text-muted-foreground">Pembayaran Tagihan Online</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${isPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
              {isPaid ? "Lunas" : "Belum Bayar"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Pelanggan</p>
              <p className="font-medium">{invoice.customerName ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paket</p>
              <p className="font-medium">{invoice.packageName ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Periode</p>
              <p className="font-medium">{invoice.period ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Jatuh Tempo</p>
              <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString("id-ID")}</p>
            </div>
          </div>

          {invoice.items && invoice.items.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold">Rincian</h3>
              <div className="mt-2 space-y-2">
                {invoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.description}</span>
                    <span>Rp {item.amount.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">{nominal}</span>
          </div>
        </div>

        {isPaid ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <p className="mt-2 font-semibold text-green-700">Tagihan ini sudah lunas. Terima kasih!</p>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Pembayaran via Transfer Bank</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Transfer sesuai nominal tagihan ke salah satu rekening resmi berikut:
            </p>

            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs text-muted-foreground">Nominal yang harus dibayar</p>
              <p className="text-2xl font-bold text-primary">{nominal}</p>
            </div>

            <div className="mt-4 space-y-3">
              {BANK_ACCOUNTS.map((acc) => (
                <div key={acc.accountNo} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{acc.bank}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.accountNo)}
                      className="flex items-center gap-1 rounded-md border border-primary/30 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedAcc === acc.accountNo ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                  <p className="mt-2 font-mono text-lg font-bold tracking-wide">{acc.accountNo}</p>
                  <p className="text-sm text-muted-foreground">a/n {BANK_ACCOUNT_NAME}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <p className="font-semibold">Setelah transfer</p>
              <p className="mt-1">
                Kirim bukti transfer ke WhatsApp admin. Layanan akan diaktifkan setelah pembayaran diverifikasi.
              </p>
            </div>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Kirim Bukti Transfer ke WhatsApp Admin
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BayarPage() {
  return (
    <Suspense fallback={null}>
      <BayarInner />
    </Suspense>
  );
}
