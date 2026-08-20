"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerNumber: "",
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/customers", form);
      router.push("/customers");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menyimpan pelanggan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tambah Pelanggan</h1>
        <p className="text-muted-foreground">Daftarkan pelanggan baru</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Data Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerNumber">No. Pelanggan</Label>
              <Input id="customerNumber" required value={form.customerNumber} onChange={(e) => update("customerNumber", e.target.value)} placeholder="CUST-00124" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon (format 62xxx)</Label>
              <Input id="phone" required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="6281234567890" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opsional)</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <textarea
                id="address"
                required
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Pelanggan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
