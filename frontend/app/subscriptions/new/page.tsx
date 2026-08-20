"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Option { id: string; label: string }

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Option[]>([]);
  const [packages, setPackages] = useState<Option[]>([]);
  const [routers, setRouters] = useState<{ id: string; name: string; host: string }[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    packageId: "",
    startDate: new Date().toISOString().split("T")[0],
    billingDay: 15,
    routerId: "",
    pppoeUsername: "",
    mikrotikProfile: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/customers").then((res) =>
      setCustomers(res.data.data.map((c: any) => ({ id: c.id, label: `${c.customerNumber} - ${c.name}` }))),
    );
    api.get("/packages?activeOnly=true").then((res) =>
      setPackages(res.data.data.map((p: any) => ({ id: p.id, label: `${p.name} (Rp ${Number(p.price).toLocaleString("id-ID")}/bln)` }))),
    );
    api.get("/routers").then((res) => setRouters(res.data.data)).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: any = {
        customerId: form.customerId,
        packageId: form.packageId,
        startDate: form.startDate,
        billingDay: Number(form.billingDay),
      };
      if (form.routerId) payload.routerId = form.routerId;
      if (form.pppoeUsername) payload.pppoeUsername = form.pppoeUsername;
      if (form.mikrotikProfile) payload.mikrotikProfile = form.mikrotikProfile;

      await api.post("/subscriptions", payload);
      router.push("/customers");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan subscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Aktivasi Subscription</h1>
        <p className="text-muted-foreground">Hubungkan pelanggan dengan paket internet</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Detail Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customer">Pelanggan</Label>
              <select
                id="customer"
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Pilih pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package">Paket</Label>
              <select
                id="package"
                required
                value={form.packageId}
                onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Pilih paket --</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input id="startDate" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingDay">Tanggal Jatuh Tempo Tiap Bulan (1-28)</Label>
              <Input id="billingDay" type="number" min={1} max={28} required value={form.billingDay} onChange={(e) => setForm({ ...form, billingDay: Number(e.target.value) })} />
            </div>

            <Separator />

            <CardDescription>Konfigurasi MikroTik (opsional — isi jika router sudah siap)</CardDescription>

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
              <p className="text-xs text-muted-foreground">Harus sama persis dengan username PPPoE secret di MikroTik</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mikrotikProfile">PPPoE Profile</Label>
              <Input
                id="mikrotikProfile"
                value={form.mikrotikProfile}
                onChange={(e) => setForm({ ...form, mikrotikProfile: e.target.value })}
                placeholder="20Mbps"
              />
              <p className="text-xs text-muted-foreground">Nama profile di MikroTik (lihat di halaman Router &gt; Profiles)</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Aktivasi Subscription"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
