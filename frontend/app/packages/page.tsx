"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Pkg {
  id: string;
  name: string;
  speedMbps: number;
  price: number;
  billingCycle: string;
  isActive: boolean;
}

const CYCLE_LABEL: Record<string, string> = {
  monthly: "Bulanan",
  quarterly: "3 Bulanan",
  yearly: "Tahunan",
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);

  function load() {
    api.get("/packages").then((res) => setPackages(res.data.data));
  }

  useEffect(() => { load(); }, []);

  async function handleDeactivate(id: string) {
    await api.delete(`/packages/${id}`);
    load();
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paket Internet</h1>
          <p className="text-muted-foreground">Kelola katalog paket layanan</p>
        </div>
        <Button asChild>
          <Link href="/packages/new">
            <Plus className="mr-2 h-4 w-4" /> Tambah Paket
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Paket</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kecepatan</TableHead>
                <TableHead>Siklus</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.speedMbps} Mbps</TableCell>
                  <TableCell>{CYCLE_LABEL[p.billingCycle] ?? p.billingCycle}</TableCell>
                  <TableCell className="text-right">Rp {Number(p.price).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "success" : "secondary"}>
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.isActive && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeactivate(p.id)}>
                        Nonaktifkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {packages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada paket
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
