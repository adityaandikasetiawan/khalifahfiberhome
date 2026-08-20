"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi } from "lucide-react";
import { portalApi } from "@/lib/portal-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await portalApi.post("/portal/auth/request-otp", { phone });
      setMessage(res.data.data.message);
      setStep("otp");
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal mengirim kode OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await portalApi.post("/portal/auth/verify-otp", { phone, otp });
      localStorage.setItem("portalAccessToken", res.data.data.accessToken);
      router.push("/portal/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Kode OTP salah atau kedaluwarsa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wifi className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Portal Pelanggan</CardTitle>
          <CardDescription>
            {step === "phone"
              ? "Masuk dengan nomor WhatsApp terdaftar"
              : `Masukkan kode OTP yang dikirim ke ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {message && step === "otp" && (
            <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6281234567890" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Kode OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Kode OTP (6 digit)</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Memverifikasi..." : "Masuk"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={cooldown > 0}
                onClick={() => setStep("phone")}
              >
                {cooldown > 0 ? `Kirim ulang dalam ${cooldown}d` : "Ganti nomor / kirim ulang"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
