"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, RefreshCw, LogOut, Send, QrCode, CheckCircle2 } from "lucide-react";

interface WaStatus {
  provider: string;
  status: string;
  qr: string | null;
  qrImage: string | null;
  info: { pushname?: string; wid?: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  disconnected: { label: "Terputus", variant: "secondary" },
  initializing: { label: "Menginisialisasi...", variant: "secondary" },
  qr: { label: "Menunggu Scan QR", variant: "secondary" },
  authenticated: { label: "Terautentikasi", variant: "success" },
  ready: { label: "Siap / Terhubung", variant: "success" },
  auth_failure: { label: "Gagal Autentikasi", variant: "destructive" },
};

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Halo, ini pesan test dari Khalifah Fiber Home.");
  const [message, setMessage] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get("/whatsapp/status");
      setStatus(res.data.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 4000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  async function handleConnect() {
    setLoading(true);
    setMessage("");
    try {
      await api.post("/whatsapp/connect");
      setMessage("Sesi dimulai. Menunggu QR code muncul...");
      setTimeout(fetchStatus, 2000);
    } catch (e: any) {
      setMessage(e?.response?.data?.message ?? "Gagal memulai sesi");
    }
    setLoading(false);
  }

  async function handleLogout() {
    setLoading(true);
    try {
      await api.post("/whatsapp/logout");
      setMessage("Berhasil logout.");
      fetchStatus();
    } catch {
      setMessage("Gagal logout");
    }
    setLoading(false);
  }

  async function handleSendTest() {
    setLoading(true);
    setMessage("");
    try {
      await api.post("/whatsapp/send-test", { phone: testPhone, message: testMsg });
      setMessage("Pesan test berhasil dikirim!");
    } catch (e: any) {
      setMessage(e?.response?.data?.message ?? "Gagal mengirim pesan");
    }
    setLoading(false);
  }

  const st = status?.status ?? "disconnected";
  const statusInfo = STATUS_LABEL[st] ?? STATUS_LABEL.disconnected;
  const isReady = st === "ready";

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Gateway</h1>
          <p className="text-muted-foreground">Kelola koneksi WhatsApp untuk notifikasi otomatis</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {message && (
        <div className={`mb-4 rounded-md p-3 text-sm ${message.includes("berhasil") || message.includes("Berhasil") ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status & Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" /> Status Koneksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-semibold">{status?.provider === "webjs" ? "whatsapp-web.js" : "Meta Cloud API"}</p>
              </div>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            {status?.info?.pushname && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-semibold">{status.info.pushname}</p>
                  <p className="text-xs">{status.info.wid?.replace("@c.us", "")}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {!isReady && (
                <Button onClick={handleConnect} disabled={loading}>
                  <QrCode className="mr-2 h-4 w-4" /> {loading ? "Memproses..." : "Mulai / Hubungkan"}
                </Button>
              )}
              {(isReady || st === "authenticated" || st === "qr") && (
                <Button variant="outline" className="text-destructive" onClick={handleLogout} disabled={loading}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              )}
            </div>

            {status?.qrImage && st === "qr" && (
              <div className="rounded-lg border p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Scan QR ini dengan WhatsApp di HP Anda:</p>
                <p className="text-xs text-muted-foreground mb-4">WhatsApp → Perangkat Tertaut → Tautkan Perangkat</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={status.qrImage} alt="WhatsApp QR" className="mx-auto w-56 h-56" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test send */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Kirim Pesan Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Tujuan</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="08123456789" />
            </div>
            <div className="space-y-2">
              <Label>Pesan</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
              />
            </div>
            <Button onClick={handleSendTest} disabled={loading || !isReady || !testPhone}>
              <Send className="mr-2 h-4 w-4" /> Kirim Test
            </Button>
            {!isReady && (
              <p className="text-xs text-muted-foreground">Gateway harus terhubung (status: Siap) untuk mengirim pesan.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-lg">Petunjuk</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Klik <strong>Mulai / Hubungkan</strong> untuk memulai sesi WhatsApp gateway.</p>
          <p>2. Tunggu QR code muncul, lalu scan menggunakan aplikasi WhatsApp di HP (menu Perangkat Tertaut).</p>
          <p>3. Setelah status berubah menjadi <strong>Siap / Terhubung</strong>, gateway siap mengirim notifikasi otomatis (tagihan, pengingat, isolir).</p>
          <p>4. Gunakan nomor WhatsApp khusus untuk gateway agar tidak mengganggu nomor pribadi.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
