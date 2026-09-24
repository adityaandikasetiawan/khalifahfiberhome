"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PasswordInput } from "@/components/password-input";

function AturPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Tautan tidak valid. Minta tautan atur password baru dari halaman login.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/portal/auth/set-password", { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan password. Tautan mungkin sudah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Khalifah Fiber Home" className="mx-auto h-14 w-auto object-contain" />
          <h1 className="mt-4 text-xl font-bold">Atur Password</h1>
        </div>

        {done ? (
          <div className="mt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold">Password Tersimpan!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sekarang Anda bisa login ke portal menggunakan email &amp; password.
            </p>
            <button
              onClick={() => router.push("/portal/login")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ke Halaman Login <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>
            )}
            <div>
              <label className="text-sm font-medium">Password Baru</label>
              <div className="mt-1">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Konfirmasi Password</label>
              <div className="mt-1">
                <PasswordInput
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Ulangi password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AturPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AturPasswordInner />
    </Suspense>
  );
}
