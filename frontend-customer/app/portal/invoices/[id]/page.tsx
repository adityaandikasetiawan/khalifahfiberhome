"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
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

interface PaymentResult {
  paymentNo?: string;
  gateway?: string;
  vaNumber?: string;
  qrisUrl?: string;
  message?: string;
}

export default function PortalInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("va");
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");

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

  const handlePay = async () => {
    setError("");
    setPaying(true);
    try {
      const res = await api.post(`/portal/invoices/${id}/pay`, { paymentMethod });
      setPaymentResult(res.data.data ?? res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memproses pembayaran. Coba lagi.");
    } finally {
      setPaying(false);
    }
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
            <span className="text-xl font-bold text-primary">
              Rp {invoice.amount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Payment Section */}
        {!isPaid && !paymentResult && (
          <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Bayar Tagihan</h3>

            {error && (
              <div className="mt-3 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="payment-method" className="text-sm font-medium">
                Metode Pembayaran
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="va">Virtual Account (Transfer Bank)</option>
                <option value="qris">QRIS</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {paying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Bayar Sekarang"
              )}
            </button>
          </div>
        )}

        {/* Payment Result */}
        {paymentResult && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Pembayaran Diproses</h3>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {paymentResult.paymentNo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Pembayaran</span>
                  <span className="font-mono font-medium">{paymentResult.paymentNo}</span>
                </div>
              )}
              {paymentResult.vaNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Virtual Account</span>
                  <span className="font-mono font-medium">{paymentResult.vaNumber}</span>
                </div>
              )}
              {paymentResult.gateway && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gateway</span>
                  <span className="font-medium">{paymentResult.gateway}</span>
                </div>
              )}
              {paymentResult.message && (
                <p className="mt-3 text-muted-foreground">{paymentResult.message}</p>
              )}
            </div>
            <Link
              href="/portal/invoices"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              ← Kembali ke daftar tagihan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
