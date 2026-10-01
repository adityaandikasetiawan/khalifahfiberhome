"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RouterOption {
  id: string;
  name: string;
}

interface Broadcast {
  id: string;
  title: string;
  targetType: string;
  targetRouterId?: string;
  status: string;
  sentCount?: number;
  failedCount?: number;
  sentAt?: string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "draft": return "secondary";
    case "sending": return "warning";
    case "sent": return "success";
    case "failed": return "danger";
    default: return "secondary";
  }
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  sending: "Mengirim",
  sent: "Terkirim",
  failed: "Gagal",
};

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [routers, setRouters] = useState<RouterOption[]>([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetType: "all",
    targetRouterId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function loadBroadcasts() {
    api.get("/broadcast").then((res) => setBroadcasts(res.data.data));
  }

  useEffect(() => {
    loadBroadcasts();
    api.get("/routers").then((res) => setRouters(res.data.data));
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: any = {
        title: form.title,
        message: form.message,
        targetType: form.targetType,
      };
      if (form.targetType === "router" && form.targetRouterId) {
        payload.targetRouterId = form.targetRouterId;
      }
      await api.post("/broadcast", payload);
      setForm({ title: "", message: "", targetType: "all", targetRouterId: "" });
      loadBroadcasts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal membuat broadcast");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(id: string) {
    try {
      await api.post(`/broadcast/${id}/send`);
      loadBroadcasts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal mengirim broadcast");
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Broadcast</h1>
        <p className="text-muted-foreground">Kirim pesan broadcast ke pelanggan</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Buat Broadcast</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Pemberitahuan maintenance" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Pesan</Label>
                <textarea
                  id="message"
                  required
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Isi pesan broadcast..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetType">Target</Label>
                <select
                  id="targetType"
                  value={form.targetType}
                  onChange={(e) => update("targetType", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">Semua Pelanggan</option>
                  <option value="router">Per Router</option>
                </select>
              </div>

              {form.targetType === "router" && (
                <div className="space-y-2">
                  <Label htmlFor="targetRouterId">Router</Label>
                  <select
                    id="targetRouterId"
                    value={form.targetRouterId}
                    onChange={(e) => update("targetRouterId", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Pilih Router --</option>
                    {routers.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Draft"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Broadcast</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terkirim</TableHead>
                  <TableHead>Gagal</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {broadcasts.map((bc) => (
                  <TableRow key={bc.id}>
                    <TableCell className="font-medium">{bc.title}</TableCell>
                    <TableCell className="text-sm">{bc.targetType === "all" ? "Semua" : "Router"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(bc.status) as any}>{STATUS_LABEL[bc.status] ?? bc.status}</Badge>
                    </TableCell>
                    <TableCell>{bc.sentCount ?? 0}</TableCell>
                    <TableCell>{bc.failedCount ?? 0}</TableCell>
                    <TableCell className="text-xs">
                      {bc.sentAt ? new Date(bc.sentAt).toLocaleString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {bc.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => handleSend(bc.id)}>
                          Kirim
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {broadcasts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Tidak ada broadcast
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
