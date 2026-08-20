"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Sub {
  id: string;
  status: string;
  billingDay: number;
  pppoeUsername?: string;
  routerId?: string;
  mikrotikProfile?: string;
  customer: { name: string; customerNumber: string };
  package: { name: string; speedMbps: number };
}

const statusVariant = (s: string) => {
  switch (s) {
    case "active": return "success";
    case "suspended": return "warning";
    case "cancelled": return "danger";
    default: return "secondary";
  }
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/subscriptions").then((res) => setSubs(res.data.data));
  }, []);

  const filtered = subs.filter((s) =>
    s.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.pppoeUsername?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.customerNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">Daftar langganan pelanggan dan konfigurasi PPPoE</p>
        </div>
        <Button asChild>
          <Link href="/subscriptions/new">
            <Plus className="mr-2 h-4 w-4" /> Aktivasi Baru
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Daftar Subscription</CardTitle>
            <Input
              placeholder="Cari pelanggan atau PPPoE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Billing Day</TableHead>
                <TableHead>PPPoE Username</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">{s.customer?.customerNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>{s.package?.name} ({s.package?.speedMbps}Mbps)</TableCell>
                  <TableCell>Tgl {s.billingDay}</TableCell>
                  <TableCell className="font-mono text-xs">{s.pppoeUsername || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-xs">{s.mikrotikProfile || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(s.status) as any}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/subscriptions/${s.id}/edit`} className="text-sm text-primary hover:underline">
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada subscription
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
