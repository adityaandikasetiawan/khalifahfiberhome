"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, RefreshCw, LogOut, Send, QrCode, CheckCircle2, ImagePlus, Loader2, MessagesSquare, Settings2 } from "lucide-react";

type TabKey = "chat" | "gateway";

export default function WhatsAppPage() {
  const [tab, setTab] = useState<TabKey>("chat");

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-muted-foreground">Chat pelanggan &amp; kelola koneksi gateway</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b">
        <button
          onClick={() => setTab("chat")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <MessagesSquare className="h-4 w-4" /> Chat
        </button>
        <button
          onClick={() => setTab("gateway")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "gateway" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Settings2 className="h-4 w-4" /> Gateway
        </button>
      </div>

      {tab === "chat" ? <ChatPanel /> : <GatewayPanel />}
    </AdminLayout>
  );
}

/* ===================== TAB CHAT ===================== */

interface Conversation {
  phone: string;
  name: string | null;
  customerNumber: string | null;
  lastBody: string | null;
  lastType: string;
  lastDirection: string;
  lastAt: string;
  unread: number;
}
interface WaMsg {
  id: string;
  phone: string;
  direction: "in" | "out";
  type: string;
  body?: string;
  mediaUrl?: string;
  senderName?: string;
  createdAt: string;
}

const MEDIA_BASE = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
const mediaSrc = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${MEDIA_BASE}${u}`);
const waktu = (s: string) => new Date(s).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });

function ChatPanel() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMsg[]>([]);
  const [activeInfo, setActiveInfo] = useState<{ name: string | null; customerNumber: string | null }>({ name: null, customerNumber: null });
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(() => {
    api.get("/whatsapp/chat/conversations").then((r) => setConvs(r.data.data ?? r.data ?? [])).catch(() => {});
  }, []);
  const loadConversation = useCallback((phone: string) => {
    api.get(`/whatsapp/chat/${phone}`).then((r) => {
      const d = r.data.data ?? r.data;
      setMessages(d.messages ?? []);
      setActiveInfo({ name: d.customer?.name ?? null, customerNumber: d.customer?.customerNumber ?? null });
    }).catch(() => {});
  }, []);

  useEffect(() => { loadConvs(); const t = setInterval(loadConvs, 10000); return () => clearInterval(t); }, [loadConvs]);
  useEffect(() => {
    if (!active) return;
    loadConversation(active);
    const t = setInterval(() => loadConversation(active), 7000);
    return () => clearInterval(t);
  }, [active, loadConversation]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) { alert("Ukuran gambar maksimal 5 MB."); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await api.post("/site-settings/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setImageUrl(res.data.data.url);
    } catch { alert("Gagal upload gambar."); } finally { setUploading(false); }
  }
  async function handleSend() {
    if (!active || (!text.trim() && !imageUrl)) return;
    setSending(true);
    try {
      await api.post("/whatsapp/chat/send", { phone: active, body: text, imageUrl: imageUrl || undefined });
      setText(""); setImageUrl(""); loadConversation(active); loadConvs();
    } catch (err: any) { alert(err?.response?.data?.message ?? "Gagal mengirim pesan."); } finally { setSending(false); }
  }

  const filtered = convs.filter((c) =>
    (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search) ||
    (c.customerNumber ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-240px)] overflow-hidden rounded-lg border bg-card">
      <div className="w-80 shrink-0 border-r flex flex-col">
        <div className="p-3 border-b flex items-center gap-2">
          <input placeholder="Cari nama / nomor..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          <button onClick={loadConvs} className="text-muted-foreground hover:text-foreground" title="Refresh"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button key={c.phone} onClick={() => setActive(c.phone)}
              className={`flex w-full items-start gap-3 border-b px-3 py-3 text-left hover:bg-muted/50 ${active === c.phone ? "bg-muted" : ""}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(c.name ?? c.phone).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-sm">{c.name ?? c.phone}</span>
                  {c.unread > 0 && <span className="shrink-0 rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                </div>
                <div className="truncate text-xs text-muted-foreground">{c.lastDirection === "out" ? "Anda: " : ""}{c.lastBody ?? ""}</div>
                <div className="text-[10px] text-muted-foreground">{c.customerNumber ?? c.phone}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Belum ada percakapan</div>}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">Pilih percakapan untuk mulai</div>
        ) : (
          <>
            <div className="border-b px-4 py-3">
              <div className="font-semibold">{activeInfo.name ?? active}</div>
              <div className="text-xs text-muted-foreground">{active}{activeInfo.customerNumber ? ` · ${activeInfo.customerNumber}` : ""}</div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm ${m.direction === "out" ? "bg-green-100" : "bg-white border"}`}>
                    {m.mediaUrl && m.type === "image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaSrc(m.mediaUrl)} alt="gambar" className="mb-1 max-h-60 rounded object-contain" />
                    )}
                    {m.mediaUrl && m.type !== "image" && (
                      <a href={mediaSrc(m.mediaUrl)} target="_blank" rel="noreferrer" className="text-primary underline text-xs">📎 Lampiran</a>
                    )}
                    {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                    <div className="mt-0.5 text-right text-[10px] text-muted-foreground">{waktu(m.createdAt)}</div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t p-3">
              {imageUrl && (
                <div className="mb-2 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaSrc(imageUrl)} alt="preview" className="h-14 w-14 rounded object-cover border" />
                  <button onClick={() => setImageUrl("")} className="text-xs text-destructive hover:underline">Hapus gambar</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <label className="cursor-pointer text-muted-foreground hover:text-foreground" title="Kirim gambar">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
                </label>
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ketik pesan... (Enter kirim, Shift+Enter baris baru)" rows={1}
                  className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <button onClick={handleSend} disabled={sending || (!text.trim() && !imageUrl)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===================== TAB GATEWAY ===================== */

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

function GatewayPanel() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Halo, ini pesan test dari Khalifah Fiber Home.");
  const [message, setMessage] = useState("");

  const fetchStatus = useCallback(async () => {
    try { const res = await api.get("/whatsapp/status"); setStatus(res.data.data); } catch { /* ignore */ }
  }, []);
  useEffect(() => { fetchStatus(); const timer = setInterval(fetchStatus, 4000); return () => clearInterval(timer); }, [fetchStatus]);

  async function handleConnect() {
    setLoading(true); setMessage("");
    try { await api.post("/whatsapp/connect"); setMessage("Sesi dimulai. Menunggu QR code muncul..."); setTimeout(fetchStatus, 2000); }
    catch (e: any) { setMessage(e?.response?.data?.message ?? "Gagal memulai sesi"); }
    setLoading(false);
  }
  async function handleLogout() {
    setLoading(true);
    try { await api.post("/whatsapp/logout"); setMessage("Berhasil logout."); fetchStatus(); }
    catch { setMessage("Gagal logout"); }
    setLoading(false);
  }
  async function handleSendTest() {
    setLoading(true); setMessage("");
    try { await api.post("/whatsapp/send-test", { phone: testPhone, message: testMsg }); setMessage("Pesan test berhasil dikirim!"); }
    catch (e: any) { setMessage(e?.response?.data?.message ?? "Gagal mengirim pesan"); }
    setLoading(false);
  }

  const st = status?.status ?? "disconnected";
  const statusInfo = STATUS_LABEL[st] ?? STATUS_LABEL.disconnected;
  const isReady = st === "ready";

  return (
    <>
      {message && (
        <div className={`mb-4 rounded-md p-3 text-sm ${message.includes("berhasil") || message.includes("Berhasil") ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>{message}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Status Koneksi</CardTitle>
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
                <Button onClick={handleConnect} disabled={loading}><QrCode className="mr-2 h-4 w-4" /> {loading ? "Memproses..." : "Mulai / Hubungkan"}</Button>
              )}
              {(isReady || st === "authenticated" || st === "qr") && (
                <Button variant="outline" className="text-destructive" onClick={handleLogout} disabled={loading}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Kirim Pesan Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Tujuan</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="08123456789" />
            </div>
            <div className="space-y-2">
              <Label>Pesan</Label>
              <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={4} value={testMsg} onChange={(e) => setTestMsg(e.target.value)} />
            </div>
            <Button onClick={handleSendTest} disabled={loading || !isReady || !testPhone}><Send className="mr-2 h-4 w-4" /> Kirim Test</Button>
            {!isReady && <p className="text-xs text-muted-foreground">Gateway harus terhubung (status: Siap) untuk mengirim pesan.</p>}
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
    </>
  );
}
