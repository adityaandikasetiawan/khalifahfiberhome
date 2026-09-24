"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { PasswordInput } from "@/components/password-input";

type Mode = "password" | "otp";

export default function PortalLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");

  // password login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // otp login
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function saveTokenAndGo(res: any) {
    const token = res.data.data?.accessToken ?? res.data.accessToken;
    localStorage.setItem("portalAccessToken", token);
    router.push("/portal/dashboard");
  }

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/portal/auth/login", { email, password });
      saveTokenAndGo(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

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
      saveTokenAndGo(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "OTP tidak valid. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError("");
    setInfo("");
    if (!email) {
      setError("Isi email dulu, lalu klik 'Lupa password'.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/portal/auth/request-password-reset", { email });
      setInfo("Jika email terdaftar, tautan atur password telah dikirim ke email Anda.");
    } catch {
      setInfo("Jika email terdaftar, tautan atur password telah dikirim ke email Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Khalifah Fiber Home" className="mx-auto h-14 w-auto object-contain" />
          <h1 className="mt-4 text-xl font-bold">Portal Pelanggan</h1>
        </div>

        {/* Toggle mode */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          <button
            onClick={() => { setMode("password"); setError(""); setInfo(""); }}
            className={`rounded-md py-1.5 font-medium transition-colors ${mode === "password" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            Email &amp; Password
          </button>
          <button
            onClick={() => { setMode("otp"); setError(""); setInfo(""); }}
            className={`rounded-md py-1.5 font-medium transition-colors ${mode === "otp" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            OTP WhatsApp
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>
        )}
        {info && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">{info}</div>
        )}

        {mode === "password" ? (
          <form onSubmit={handleLoginPassword} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="mt-1">
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  required
                  className="w-full rounded-lg border bg-background px-4 py-2.5 pr-11 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Masuk <ArrowRight className="h-4 w-4" /></>)}
            </button>
            <button
              type="button"
              onClick={handleForgot}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary"
            >
              Lupa / belum punya password?
            </button>
          </form>
        ) : step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="phone" className="text-sm font-medium">Nomor HP</label>
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Kirim OTP <ArrowRight className="h-4 w-4" /></>)}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Kode OTP telah dikirim ke <strong>{phone}</strong></p>
            <div>
              <label htmlFor="otp" className="text-sm font-medium">Kode OTP</label>
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
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary"
            >
              Ganti nomor HP
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum berlangganan?{" "}
          <Link href="/daftar" className="text-primary hover:underline">Daftar di sini</Link>
        </p>
      </div>
    </main>
  );
}
