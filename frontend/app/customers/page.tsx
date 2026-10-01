"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  phone: string;
  status: string;
  routerName?: string | null;
  routerId?: string | null;
  packageName?: string | null;
  pppoeUsername?: string | null;
}

interface RouterOpt {
  id: string;
  name: string;
}

const PAGE_SIZE = 10;

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "success";
    case "suspended": return "warning";
    case "terminated": return "danger";
    default: return "outline";
  }
};

const statusLabel: Record<string, string> = {
  active: "Aktif",
  suspended: "Isolir",
  terminated: "Berhenti",
  pending_verification: "Verifikasi",
  pending_active: "Menunggu Aktivasi",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [routers, setRouters] = useState<RouterOpt[]>([]);
  const [search, setSearch] = useState("");
  const [routerFilter, setRouterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/customers").then((res) => setCustomers(res.data.data ?? []));
    api.get("/routers").then((res) => setRouters(res.data.data ?? [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) => {
      const matchSearch =
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.customerNumber ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q);
      const matchRouter = !routerFilter || c.routerId === routerFilter;
      const matchStatus = !statusFilter || c.status === statusFilter;
      return matchSearch && matchRouter && matchStatus;
    });
  }, [customers, search, routerFilter, statusFilter]);

  // Reset ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setPage(1);
  }, [search, routerFilter, statusFilter]);

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
          <h1 className="text-2xl font-bold tracking-tight">Pelanggan</h1>
          <p className="text-muted-foreground">Kelola data pelanggan ISP</p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">
              Daftar Pelanggan{" "}
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={routerFilter}
                onChange={(e) => setRouterFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Semua Router</option>
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="suspended">Isolir</option>
                <option value="terminated">Berhenti</option>
              </select>
              <Input
                placeholder="Cari nama / nomor / telepon..."
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
                  <TableHead className="w-[120px]">No. Pelanggan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-[140px]">Telepon</TableHead>
                  <TableHead className="w-[150px]">Router</TableHead>
                  <TableHead className="w-[150px]">Paket</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-sm">{c.customerNumber}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.phone ? c.phone : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {c.routerName ? (
                        <Badge variant="outline">{c.routerName}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{c.packageName ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(c.status) as any}>
                        {statusLabel[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/customers/${c.id}/edit`} className="text-sm text-primary hover:underline">
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Tidak ada data pelanggan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {filtered.length} pelanggan
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
