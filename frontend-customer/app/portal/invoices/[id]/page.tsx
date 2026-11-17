"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy } from "lucide-react";
import { api } from "@/lib/api";

interface InvoiceItem {
  description: string;
  amount: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  period?: string;
  items?: InvoiceItem[];
  createdAt?: string;
}

// Rekening resmi tujuan transfer manual (a/n Purwo Budi Sunaryono).
const BANK_ACCOUNT_NAME = "Purwo Budi Sunaryono";
const BANK_ACCOUNTS = [
  { bank: "BRI", accountNo: "454001025033539" },
];
// Nomor WhatsApp admin untuk kirim bukti transfer (konsisten dgn kontak portal).
const ADMIN_WA = "6282128052229";

export default function PortalInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAcc, setCopiedAcc] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("portalAccessToken");
    if (!token) {
      router.push("/portal/login");
      return;
    }

    api
      .get(`/portal/invoices/${id}`)
      .then((res) => {
        setInvoice(res.data.data ?? res.data);
      })
      .catch(() => {
        router.push("/portal/invoices");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleCopy = (accountNo: string) => {
    navigator.clipboard?.writeText(accountNo);
    setCopiedAcc(accountNo);
    setTimeout(() => setCopiedAcc(""), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!invoice) return null;

  const isPaid = invoice.status === "paid";
  const nominal = `Rp ${invoice.amount.toLocaleString("id-ID")}`;
  const waMessage = encodeURIComponent(
    `Halo admin, saya sudah transfer untuk tagihan ${invoice.invoiceNumber} sebesar ${nominal}. Berikut bukti transfernya.`,
  );
  const waLink = `https://wa.me/${ADMIN_WA}?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/portal/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Tagihan
        </Link>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isPaid
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isPaid ? "Lunas" : "Belum Bayar"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Periode</p>
              <p className="font-medium">{invoice.period ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Jatuh Tempo</p>
              <p className="font-medium">
                {new Date(invoice.dueDate).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>

          {/* Items */}
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

          {/* Total */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">{nominal}</span>
          </div>
        </div>

        {/* Payment Section - transfer manual */}
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
