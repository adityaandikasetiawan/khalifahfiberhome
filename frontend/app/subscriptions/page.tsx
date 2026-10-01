"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
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

const PAGE_SIZE = 10;

const statusVariant = (s: string) => {
  switch (s) {
    case "active": return "success";
    case "suspended": return "warning";
    case "cancelled": return "danger";
    default: return "secondary";
  }
};

const statusLabel: Record<string, string> = {
  active: "Aktif",
  suspended: "Isolir",
  cancelled: "Dibatalkan",
  pending_activation: "Menunggu Aktivasi",
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/subscriptions").then((res) => setSubs(res.data.data ?? []));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subs.filter((s) => {
      const matchSearch =
        (s.customer?.name ?? "").toLowerCase().includes(q) ||
        (s.pppoeUsername ?? "").toLowerCase().includes(q) ||
        (s.customer?.customerNumber ?? "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [subs, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, filtered.length);

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
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">
              Daftar Subscription{" "}
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="suspended">Isolir</option>
                <option value="cancelled">Dibatalkan</option>
                <option value="pending_activation">Menunggu Aktivasi</option>
              </select>
              <Input
                placeholder="Cari pelanggan / PPPoE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="w-[180px]">Paket</TableHead>
                  <TableHead className="w-[100px]">Tgl Tagih</TableHead>
                  <TableHead className="w-[140px]">PPPoE</TableHead>
                  <TableHead className="w-[110px]">Profile</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/40">
                    <TableCell>
                      <p className="font-medium">{s.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">{s.customer?.customerNumber}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.package?.name}
                      {s.package?.speedMbps ? (
                        <span className="text-muted-foreground"> ({s.package.speedMbps}Mbps)</span>
                      ) : null}
                    </TableCell>
                    <TableCell>Tgl {s.billingDay}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.pppoeUsername || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.mikrotikProfile || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status) as any}>
                        {statusLabel[s.status] ?? s.status}
                      </Badge>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Tidak ada subscription
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {filtered.length} subscription
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">Halaman {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
