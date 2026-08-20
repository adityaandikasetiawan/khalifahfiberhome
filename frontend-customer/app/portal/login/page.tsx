"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/portal/auth/request-otp", { phone });
      setStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal mengirim OTP. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/portal/auth/verify-otp", { phone, otp });
      const token = res.data.data?.accessToken ?? res.data.accessToken;
      localStorage.setItem("portalAccessToken", token);
      router.push("/portal/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "OTP tidak valid. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Wifi className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Portal Pelanggan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Khalifah Fiber Home</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="mt-8 space-y-4">
            <div>
              <label htmlFor="phone" className="text-sm font-medium">
                Nomor HP
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Kirim OTP
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Kode OTP telah dikirim ke <strong>{phone}</strong>
            </p>
            <div>
              <label htmlFor="otp" className="text-sm font-medium">
                Kode OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Masukkan 6 digit OTP"
                maxLength={6}
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-center text-lg tracking-widest placeholder:text-sm placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary"
            >
              Ganti nomor HP
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
