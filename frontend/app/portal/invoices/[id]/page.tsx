"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { portalApi } from "@/lib/portal-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const METHOD_LABEL: Record<string, string> = { va: "Virtual Account", qris: "QRIS", ewallet: "E-Wallet" };

const statusVariant = (status: string) => {
  switch (status) {
    case "paid": return "success";
    case "unpaid": return "warning";
    case "overdue": return "danger";
    default: return "secondary";
  }
};

export default function PortalInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"va" | "qris" | "ewallet">("qris");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [payResult, setPayResult] = useState<any>(null);

  function load() {
    if (params?.id) {
      portalApi
        .get(`/portal/invoices/${params.id}`)
        .then((res) => setInvoice(res.data.data))
        .catch(() => setError("Tagihan tidak ditemukan atau bukan milik Anda"));
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("portalAccessToken")) {
      router.push("/portal/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  async function handlePay() {
    setPaying(true);
    setPayError("");
    setPayResult(null);
    try {
      const res = await portalApi.post(`/portal/invoices/${invoice.id}/pay`, { paymentMethod: method });
      setPayResult(res.data.data);
      const redirectUrl = res.data.data?.gateway?.redirect_url;
      if (redirectUrl) window.open(redirectUrl, "_blank");
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? "Gagal membuat transaksi pembayaran.");
    } finally {
      setPaying(false);
    }
  }

  if (error) {
    return <main className="mx-auto max-w-md p-4 text-center text-sm text-destructive">{error}</main>;
  }
  if (!invoice) return <main className="mx-auto max-w-md p-4 text-muted-foreground">Memuat...</main>;

  const isMockGateway = payResult?.gateway?.mock === true;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-muted/30 p-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/portal/dashboard")} className="mb-3">
        &larr; Kembali
      </Button>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{invoice.invoiceNumber}</p>
            <Badge variant={statusVariant(invoice.status) as any}>{invoice.status}</Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Paket: {invoice.subscription?.package?.name}</p>
            <p>Jatuh tempo: {new Date(invoice.dueDate).toLocaleDateString("id-ID")}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            {invoice.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.description}</span>
                <span>Rp {Number(item.subtotal).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>Rp {Number(invoice.totalAmount).toLocaleString("id-ID")}</span>
          </div>

          {invoice.status !== "paid" && (
            <>
              <Separator />
              {payError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{payError}</div>
              )}

              {!payResult ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Metode Bayar</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as any)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="qris">QRIS</option>
                      <option value="va">Virtual Account</option>
                      <option value="ewallet">E-Wallet</option>
                    </select>
                  </div>
                  <Button onClick={handlePay} disabled={paying} className="w-full">
                    {paying ? "Memproses..." : "Bayar Sekarang"}
                  </Button>
                </div>
              ) : isMockGateway ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-medium">Transaksi {METHOD_LABEL[method]} dibuat (mode simulasi).</p>
                  <p className="mt-1 text-amber-700 text-xs">
                    Menunggu konfirmasi pembayaran. Status akan terupdate otomatis.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-emerald-700">
                  Transaksi dibuat. Selesaikan pembayaran di halaman yang terbuka.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
