"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  status: string;
  subscription: { customer: { name: string }; package: { name: string } };
}

const PAGE_SIZE = 10;

const statusVariant = (status: string) => {
  switch (status) {
    case "paid": return "success";
    case "unpaid": return "warning";
    case "overdue": return "danger";
    default: return "secondary";
  }
};

const statusLabel: Record<string, string> = {
  paid: "Lunas",
  unpaid: "Belum Bayar",
  overdue: "Jatuh Tempo",
  cancelled: "Dibatalkan",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/invoices").then((res) => setInvoices(res.data.data ?? []));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchSearch =
        (inv.subscription?.customer?.name ?? "").toLowerCase().includes(q) ||
        (inv.invoiceNumber ?? "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
        <p className="text-muted-foreground">Semua tagihan pelanggan</p>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">
              Daftar Invoice{" "}
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="paid">Lunas</option>
                <option value="unpaid">Belum Bayar</option>
                <option value="overdue">Jatuh Tempo</option>
              </select>
              <Input
                placeholder="Cari pelanggan / nomor invoice..."
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
                  <TableHead className="w-[160px]">No. Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="w-[130px]">Jatuh Tempo</TableHead>
                  <TableHead className="w-[140px] text-right">Tagihan</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{inv.subscription?.customer?.name}</TableCell>
                    <TableCell className="text-sm">{inv.subscription?.package?.name}</TableCell>
                    <TableCell>{new Date(inv.dueDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="text-right">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(inv.status) as any}>
                        {statusLabel[inv.status] ?? inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/invoices/${inv.id}`} className="text-sm text-primary hover:underline">
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Tidak ada invoice
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {filtered.length} invoice
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
