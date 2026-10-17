"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const METHOD_LABEL: Record<string, string> = { va: "Virtual Account", qris: "QRIS", ewallet: "E-Wallet" };

const statusVariant = (status: string) => {
  switch (status) {
    case "paid": case "success": return "success";
    case "unpaid": case "pending": return "warning";
    case "overdue": case "failed": return "danger";
    default: return "secondary";
  }
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [method, setMethod] = useState<"va" | "qris" | "ewallet">("va");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [payResult, setPayResult] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  // Download PDF invoice. Endpoint butuh JWT, jadi ambil sebagai blob lewat
  // axios (interceptor menyisipkan token) lalu picu unduhan di browser.
  async function handleDownloadPdf() {
    if (!invoice?.id) return;
    setDownloading(true);
    try {
      const res = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh PDF invoice.");
    } finally {
      setDownloading(false);
    }
  }

  function load() {
    if (params?.id) {
      api.get(`/invoices/${params.id}`).then((res) => setInvoice(res.data.data));
    }
  }

  useEffect(load, [params?.id]);

  async function handlePay() {
    setPaying(true);
    setPayError("");
    setPayResult(null);
    try {
      const res = await api.post("/payments/create-transaction", { invoiceId: invoice.id, paymentMethod: method });
      setPayResult(res.data.data);
      const redirectUrl = res.data.data?.gateway?.redirect_url;
      if (redirectUrl) window.open(redirectUrl, "_blank");
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? "Gagal membuat transaksi pembayaran.");
    } finally {
      setPaying(false);
    }
  }

  async function handleSimulate(outcome: "success" | "failed") {
    if (!payResult?.payment?.id) return;
    await api.post(`/payments/mock/${payResult.payment.id}/simulate`, { outcome });
    setPayResult(null);
    load();
  }

  async function handleManualPay() {
    const note = window.prompt(
      "Pembayaran MANUAL (bypass). Invoice akan ditandai LUNAS dan layanan diaktifkan otomatis.\n\nCatatan (opsional, mis. 'Transfer BCA 7 Okt a/n Budi'):",
      "",
    );
    if (note === null) return; // batal
    setPaying(true);
    setPayError("");
    try {
      await api.post(`/payments/manual/${invoice.id}`, { note: note || undefined });
      load();
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? "Gagal memproses pembayaran manual.");
    } finally {
      setPaying(false);
    }
  }

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div>
      </AdminLayout>
    );
  }

  const isMockGateway = payResult?.gateway?.mock === true;

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detail Invoice</h1>
          <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>
        <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
          <Download className="mr-1 h-4 w-4" /> {downloading ? "Menyiapkan..." : "Download PDF"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
              <Badge variant={statusVariant(invoice.status) as any}>{invoice.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pelanggan</p>
                <p className="font-medium">{invoice.subscription?.customer?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Paket</p>
                <p className="font-medium">{invoice.subscription?.package?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jatuh Tempo</p>
                <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString("id-ID")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Periode</p>
                <p className="font-medium">{new Date(invoice.periodStart).toLocaleDateString("id-ID")} - {new Date(invoice.periodEnd).toLocaleDateString("id-ID")}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {invoice.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.description} x{item.qty}</span>
                  <span>Rp {Number(item.subtotal).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>Rp {Number(invoice.totalAmount).toLocaleString("id-ID")}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {invoice.status !== "paid" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{payError}</div>
                )}

                {!payResult ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Metode</label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="va">Virtual Account</option>
                        <option value="qris">QRIS</option>
                        <option value="ewallet">E-Wallet</option>
                      </select>
                    </div>
                    <Button onClick={handlePay} disabled={paying} className="w-full">
                      {paying ? "Memproses..." : "Bayar Sekarang"}
                    </Button>

                    <div className="relative py-1 text-center">
                      <span className="bg-card px-2 text-[11px] text-muted-foreground relative z-10">atau</span>
                      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                    </div>

                    {/* Bypass manual: untuk pembayaran transfer/cash manual. Admin tandai
                        lunas -> layanan aktif otomatis tanpa lewat payment gateway. */}
                    <Button
                      onClick={handleManualPay}
                      disabled={paying}
                      variant="outline"
                      className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                    >
                      {paying ? "Memproses..." : "Tandai Lunas (Pembayaran Manual)"}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Gunakan jika pelanggan sudah bayar via transfer/cash manual. Invoice akan lunas &amp; layanan diaktifkan otomatis.
                    </p>
                  </>
                ) : isMockGateway ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="mb-2 font-medium text-amber-800">Mode Simulasi</p>
                    <p className="mb-3 text-amber-700 text-xs">
                      Transaksi {METHOD_LABEL[method]} dibuat. Simulasikan hasilnya:
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSimulate("success")}>
                        Sukses
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleSimulate("failed")}>
                        Gagal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm space-y-2">
                    <p className="font-medium text-emerald-800">Transaksi Berhasil Dibuat</p>
                    {payResult?.gateway?.paymentNo && (
                      <div>
                        <p className="text-xs text-emerald-600">Nomor Pembayaran:</p>
                        <p className="font-mono font-bold text-emerald-900 text-lg">{payResult.gateway.paymentNo}</p>
                      </div>
                    )}
                    {payResult?.gateway?.paymentName && (
                      <p className="text-xs text-emerald-700">Channel: {payResult.gateway.paymentName}</p>
                    )}
                    {payResult?.gateway?.expired && (
                      <p className="text-xs text-emerald-700">Expired: {payResult.gateway.expired}</p>
                    )}
                    {payResult?.gateway?.url && (
                      <a href={payResult.gateway.url} target="_blank" rel="noopener noreferrer" className="block text-center rounded-md bg-primary py-2 text-xs font-medium text-white mt-2">
                        Buka Halaman Pembayaran
                      </a>
                    )}
                    <p className="text-xs text-emerald-600 mt-1">
                      Status akan terupdate otomatis setelah pembayaran dikonfirmasi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Riwayat Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="uppercase text-xs">{p.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(p.status) as any}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {new Date(p.createdAt).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
