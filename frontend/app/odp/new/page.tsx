"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RouterOption {
  id: string;
  name: string;
}

interface Technician {
  id: string;
  name: string;
}

export default function NewODPPage() {
  const router = useRouter();
  const [routers, setRouters] = useState<RouterOption[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [form, setForm] = useState({
    name: "",
    totalPorts: "",
    latitude: "",
    longitude: "",
    photoUrl: "",
    routerId: "",
    technicianId: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/routers").then((res) => setRouters(res.data.data));
    api.get("/users", { params: { role: "technician" } }).then((res) => setTechnicians(res.data.data));
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: any = {
        name: form.name,
        totalPorts: Number(form.totalPorts),
      };
      if (form.latitude) payload.latitude = Number(form.latitude);
      if (form.longitude) payload.longitude = Number(form.longitude);
      if (form.photoUrl) payload.photoUrl = form.photoUrl;
      if (form.routerId) payload.routerId = form.routerId;
      if (form.technicianId) payload.technicianId = form.technicianId;
      if (form.notes) payload.notes = form.notes;
      await api.post("/odp", payload);
      router.push("/odp");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan ODP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tambah ODP</h1>
        <p className="text-muted-foreground">Daftarkan Optical Distribution Point baru</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Data ODP</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nama ODP</Label>
              <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="ODP-001" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPorts">Total Port</Label>
              <Input id="totalPorts" type="number" required min={1} value={form.totalPorts} onChange={(e) => update("totalPorts", e.target.value)} placeholder="8" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} placeholder="-6.200000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} placeholder="106.816666" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">Foto URL (opsional)</Label>
              <Input id="photoUrl" value={form.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="routerId">Router</Label>
              <select
                id="routerId"
                value={form.routerId}
                onChange={(e) => update("routerId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Pilih Router --</option>
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicianId">Teknisi</Label>
              <select
                id="technicianId"
                value={form.technicianId}
                onChange={(e) => update("technicianId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Pilih Teknisi --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Catatan tambahan..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan ODP"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
