"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { BankLogo, BANK_CONFIG, EWALLET_CONFIG } from "@/components/bank-logo";

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
  url?: string;
  paymentNo?: string;
  paymentName?: string;
  vaNumber?: string;
  qrImage?: string;
  qrString?: string;
  paymentMethod?: string;
  expired?: string;
  total?: number;
  subTotal?: number;
  fee?: number;
  transactionId?: number;
  message?: string;
  mock?: boolean;
  order_id?: string;
}

export default function PortalInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [paymentChannel, setPaymentChannel] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

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
      const res = await api.post(`/portal/invoices/${id}/pay`, { paymentMethod, paymentChannel: paymentChannel || undefined });
      const body = res.data.data ?? res.data;
      // Backend mengembalikan { payment, gateway: {...} }
      const gw = body.gateway ?? body;
      const method = gw.paymentMethod ?? paymentMethod;
      const isQris = method === "qris";
      setPaymentResult({
        url: gw.url,
        paymentNo: gw.paymentNo,
        paymentName: gw.paymentName,
        // Untuk QRIS, paymentNo berisi QR string mentah -> jangan tampilkan sebagai VA
        vaNumber: isQris ? undefined : (gw.vaNumber ?? gw.paymentNo),
        qrImage: gw.qrImage ?? gw.QrImage,
        qrString: gw.qrString ?? gw.QrString ?? (isQris ? gw.paymentNo : undefined),
        paymentMethod: method,
        expired: gw.expired,
        total: gw.total,
        subTotal: gw.subTotal,
        fee: gw.fee,
        transactionId: gw.transactionId,
        message: gw.message,
        mock: gw.mock,
        order_id: gw.order_id,
      });
      // Jika iPaymu mengembalikan URL pembayaran, arahkan pelanggan ke sana
      if (gw.url) {
        window.open(gw.url, "_blank");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memproses pembayaran. Coba lagi.");
    } finally {
      setPaying(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckMsg("");
    try {
      const res = await api.post(`/portal/invoices/${id}/check-payment`);
      const data = res.data.data ?? res.data;
      setCheckMsg(data.message ?? "");
      if (data.status === "paid") {
        // Refresh detail invoice supaya status berubah jadi Lunas
        const inv = await api.get(`/portal/invoices/${id}`);
        setInvoice(inv.data.data ?? inv.data);
        setPaymentResult(null);
      }
    } catch (err: any) {
      setCheckMsg(err?.response?.data?.message ?? "Gagal mengecek status. Coba lagi.");
    } finally {
      setChecking(false);
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
                onChange={(e) => { setPaymentMethod(e.target.value); setPaymentChannel(""); }}
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="qris">QRIS (semua e-wallet & m-banking)</option>
                <option value="va">Virtual Account (Transfer Bank)</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </div>

            {/* Pilih bank untuk VA - grid tombol dengan logo */}
            {paymentMethod === "va" && (
              <div className="mt-3">
                <label className="text-sm font-medium">Pilih Bank</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {Object.entries(BANK_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentChannel(key)}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                        paymentChannel === key
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <BankLogo channel={key} className="h-8 w-16 text-[11px]" />
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pilih provider untuk E-Wallet - grid tombol dengan logo */}
            {paymentMethod === "ewallet" && (
              <div className="mt-3">
                <label className="text-sm font-medium">Pilih E-Wallet</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {Object.entries(EWALLET_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentChannel(key)}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                        paymentChannel === key
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <BankLogo channel={key} className="h-8 w-16 text-[11px]" />
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Anda akan diarahkan ke halaman pembayaran e-wallet.</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={paying || ((paymentMethod === "va" || paymentMethod === "ewallet") && !paymentChannel)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-6 rounded-xl border border-primary/20 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Instruksi Pembayaran</h3>
            </div>

            {/* QRIS - tampilan khusus (mirip halaman pembayaran QRIS) */}
            {(paymentResult.qrString || paymentResult.qrImage) ? (
              <div className="overflow-hidden rounded-xl border">
                <div className="bg-primary px-4 py-3 text-center">
                  <p className="font-semibold text-primary-foreground">Bayar dengan QRIS</p>
                </div>
                <div className="p-6 text-center">
                  <div className="mx-auto inline-block rounded-lg bg-white p-3">
                    {paymentResult.qrString ? (
                      <QRCodeSVG value={paymentResult.qrString} size={256} level="M" includeMargin />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={paymentResult.qrImage} alt="QRIS" className="h-64 w-64" />
                    )}
                  </div>
                </div>
                {/* Rincian harga */}
                <div className="divide-y border-t text-sm">
                  {typeof paymentResult.subTotal === "number" && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">Harga</span>
                      <span>Rp {Number(paymentResult.subTotal).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {typeof paymentResult.fee === "number" && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">Biaya Layanan</span>
                      <span>Rp {Number(paymentResult.fee).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-muted/40 px-4 py-3">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">
                      Rp {Number(
                        (paymentResult.total ??
                          ((paymentResult.subTotal ?? 0) + (paymentResult.fee ?? 0)))
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                {/* Catatan */}
                <ul className="space-y-1.5 border-t px-4 py-4 text-xs text-muted-foreground">
                  <li>• Silakan scan gambar di atas menggunakan aplikasi OVO, DANA, LinkAja, GoPay, ShopeePay, atau mobile banking yang mendukung pembayaran QRIS.</li>
                  {paymentResult.expired && <li>• Pembayaran berlaku s/d {paymentResult.expired}.</li>}
                </ul>
              </div>
            ) : paymentResult.vaNumber ? (
              /* Virtual Account - tampilan dengan logo bank */
              <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
                  <span className="font-semibold">Virtual Account</span>
                  {paymentChannel && <BankLogo channel={paymentChannel} className="h-7 w-16 text-[11px]" />}
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted-foreground mb-1">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                    <span className="font-mono text-lg font-bold tracking-wide text-primary">{paymentResult.vaNumber}</span>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard?.writeText(String(paymentResult.vaNumber)); setCheckMsg("Nomor VA disalin."); }}
                      className="rounded-md border border-primary/30 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      Salin
                    </button>
                  </div>
                </div>
                <div className="divide-y border-t text-sm">
                  {typeof paymentResult.subTotal === "number" && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">Harga</span>
                      <span>Rp {Number(paymentResult.subTotal).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {typeof paymentResult.fee === "number" && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">Biaya Layanan</span>
                      <span>Rp {Number(paymentResult.fee).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-muted/40 px-4 py-3">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">
                      Rp {Number(paymentResult.total ?? ((paymentResult.subTotal ?? 0) + (paymentResult.fee ?? 0))).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <ul className="space-y-1.5 border-t px-4 py-4 text-xs text-muted-foreground">
                  <li>• Transfer ke nomor Virtual Account di atas melalui ATM, m-banking, atau internet banking.</li>
                  {paymentResult.expired && <li>• Bayar sebelum {paymentResult.expired}.</li>}
                </ul>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {paymentResult.total && (
                  <div className="flex justify-between px-4">
                    <span className="text-muted-foreground">Total Bayar</span>
                    <span className="font-semibold">Rp {Number(paymentResult.total).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {paymentResult.paymentName && (
                  <div className="flex justify-between px-4">
                    <span className="text-muted-foreground">Channel</span>
                    <span className="font-medium">{paymentResult.paymentName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tombol ke halaman pembayaran iPaymu */}
            {paymentResult.url && (
              <a
                href={paymentResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Lanjutkan ke Halaman Pembayaran
              </a>
            )}

            {/* Tombol cek status pembayaran (fallback webhook) */}
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary/30 py-3 font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mengecek...
                </>
              ) : (
                "Saya Sudah Bayar / Cek Status"
              )}
            </button>
            {checkMsg && (
              <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700">{checkMsg}</p>
            )}

            {paymentResult.message && (
              <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700">{paymentResult.message}</p>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Status tagihan akan otomatis berubah menjadi "Lunas" setelah pembayaran Anda diterima oleh sistem.
            </p>

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
