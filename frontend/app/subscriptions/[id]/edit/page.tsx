"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function EditSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const [routers, setRouters] = useState<{ id: string; name: string; host: string }[]>([]);
  const [form, setForm] = useState({
    billingDay: 15,
    routerId: "",
    pppoeUsername: "",
    mikrotikProfile: "",
    status: "active",
  });
  const [sub, setSub] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    api.get(`/subscriptions/${params.id}`).then((res) => {
      const s = res.data.data;
      setSub(s);
      setForm({
        billingDay: s.billingDay,
        routerId: s.routerId || "",
        pppoeUsername: s.pppoeUsername || "",
        mikrotikProfile: s.mikrotikProfile || "",
        status: s.status,
      });
      setLoadingData(false);
    });
    api.get("/routers").then((res) => setRouters(res.data.data)).catch(() => {});
  }, [params?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.patch(`/subscriptions/${params.id}`, {
        billingDay: Number(form.billingDay),
        routerId: form.routerId || null,
        pppoeUsername: form.pppoeUsername || null,
        mikrotikProfile: form.mikrotikProfile || null,
      });
      router.push("/subscriptions");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan perubahan");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Subscription</h1>
        <p className="text-muted-foreground">
          {sub?.customer?.name} — {sub?.package?.name}
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Konfigurasi Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="billingDay">Tanggal Jatuh Tempo (1-28)</Label>
              <Input id="billingDay" type="number" min={1} max={28} value={form.billingDay} onChange={(e) => setForm({ ...form, billingDay: Number(e.target.value) })} />
            </div>

            <Separator />

            <CardDescription>Konfigurasi MikroTik</CardDescription>

            <div className="space-y-2">
              <Label htmlFor="routerId">Router MikroTik</Label>
              <select
                id="routerId"
                value={form.routerId}
                onChange={(e) => setForm({ ...form, routerId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Tidak dikonfigurasi --</option>
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.host})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pppoeUsername">Username PPPoE</Label>
              <Input
                id="pppoeUsername"
                value={form.pppoeUsername}
                onChange={(e) => setForm({ ...form, pppoeUsername: e.target.value })}
                placeholder="pppoe-budi001"
              />
              <p className="text-xs text-muted-foreground">Harus sama persis dengan PPPoE secret di MikroTik</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mikrotikProfile">PPPoE Profile</Label>
              <Input
                id="mikrotikProfile"
                value={form.mikrotikProfile}
                onChange={(e) => setForm({ ...form, mikrotikProfile: e.target.value })}
                placeholder="20Mbps"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
