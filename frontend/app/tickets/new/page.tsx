"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Customer {
  id: string;
  name: string;
  customerNumber: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    subject: "",
    description: "",
    priority: "medium",
    photoUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/customers").then((res) => setCustomers(res.data.data));
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: any = { ...form };
      if (!payload.photoUrl) delete payload.photoUrl;
      await api.post("/tickets", payload);
      router.push("/tickets");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal membuat tiket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Buat Tiket Baru</h1>
        <p className="text-muted-foreground">Laporkan gangguan pelanggan</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Data Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerId">Pelanggan</Label>
              <select
                id="customerId"
                required
                value={form.customerId}
                onChange={(e) => update("customerId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>-- Pilih Pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customerNumber} - {c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Gangguan koneksi internet" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                required
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Jelaskan detail gangguan..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">Foto URL (opsional)</Label>
              <Input id="photoUrl" value={form.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} placeholder="https://..." />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Buat Tiket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
