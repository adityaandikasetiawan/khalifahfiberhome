"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPackagePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    speedMbps: 10,
    price: 0,
    billingCycle: "monthly",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/packages", form);
      router.push("/packages");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan paket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tambah Paket Internet</h1>
        <p className="text-muted-foreground">Buat paket layanan baru</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Detail Paket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nama Paket</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Home 30Mbps" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Kecepatan (Mbps)</Label>
              <Input id="speed" type="number" min={1} required value={form.speedMbps} onChange={(e) => setForm({ ...form, speedMbps: Number(e.target.value) })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Harga per Periode (Rp)</Label>
              <Input id="price" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycle">Siklus Tagihan</Label>
              <select
                id="cycle"
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="monthly">Bulanan</option>
                <option value="quarterly">3 Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Paket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
