"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface VerifyResult {
  message: string;
  customerNumber: string;
  phone: string;
  invoice: { id: string; invoiceNumber: string; totalAmount: number; status: string };
  packageName: string;
}

function VerifikasiInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Tautan verifikasi tidak valid.");
      return;
    }
    api
      .get(`/registrations/verify`, { params: { token } })
      .then((res) => {
        setResult(res.data.data ?? res.data);
        setState("success");
      })
      .catch((err: any) => {
        setErrorMsg(err?.response?.data?.message ?? "Verifikasi gagal atau tautan sudah kedaluwarsa.");
        setState("error");
      });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Khalifah Fiber Home" className="mx-auto h-14 w-auto object-contain" />
        <h1 className="mt-4 text-xl font-bold">Verifikasi Pendaftaran</h1>

        {state === "loading" && (
          <div className="mt-8 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Memverifikasi email Anda...</p>
          </div>
        )}

        {state === "success" && result && (
          <div className="mt-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold">Email Terverifikasi!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>

            <div className="mt-6 rounded-xl bg-muted/50 p-4 text-left text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">No. Pelanggan</span>
                <span className="font-medium">{result.customerNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-medium">{result.packageName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">No. Tagihan</span>
                <span className="font-medium">{result.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-1">
                <span className="text-muted-foreground">Biaya Registrasi</span>
                <span className="font-bold text-primary">
                  Rp {Number(result.invoice.totalAmount).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Masuk ke portal dengan nomor <strong>{result.phone}</strong> (login via OTP WhatsApp) untuk
              menyelesaikan pembayaran registrasi.
            </p>

            <button
              onClick={() => router.push("/portal/login")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Masuk & Bayar Registrasi
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="mt-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold">Verifikasi Gagal</h2>
            <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => router.push("/daftar")}
              className="mt-6 w-full rounded-lg border py-2.5 font-medium hover:bg-muted transition-colors"
            >
              Kembali ke Pendaftaran
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifikasiPage() {
  return (
    <Suspense fallback={null}>
      <VerifikasiInner />
    </Suspense>
  );
}
