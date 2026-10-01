"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PaymentRow {
  id: string;
  createdAt: string;
  paidAt: string | null;
  amount: number;
  status: string;
  paymentMethod: string;
  gatewayReference: string | null;
  invoiceId: string;
  invoiceNumber: string | null;
  customerName: string | null;
  customerNumber: string | null;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "success": return "success";
    case "pending": return "warning";
    case "failed": return "danger";
    case "expired": return "secondary";
    default: return "secondary";
  }
};

const statusLabel: Record<string, string> = {
  success: "Berhasil",
  pending: "Menunggu",
  failed: "Gagal",
  expired: "Kadaluarsa",
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const buildParams = useCallback(
    (extra: Record<string, any> = {}) => {
      const p: Record<string, any> = {};
      if (status) p.status = status;
      if (from) p.from = from;
      if (to) p.to = to;
      if (search) p.search = search;
      return { ...p, ...extra };
    },
    [status, from, to, search],
  );

  const load = useCallback(
    (goPage = 1) => {
      setLoading(true);
      api
        .get("/payments", { params: buildParams({ page: goPage, limit: 25 }) })
        .then((res) => {
          const d = res.data.data ?? res.data;
          setRows(d.data ?? []);
          setTotal(d.total ?? 0);
          setTotalPages(d.totalPages ?? 1);
          setPage(d.page ?? goPage);
        })
        .finally(() => setLoading(false));
    },
    [buildParams],
  );

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/payments/export", {
        params: buildParams(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `pembayaran-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pembayaran</h1>
          <p className="text-muted-foreground">Histori pembayaran pelanggan ({total} transaksi)</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline">
          {exporting ? "Mengekspor..." : "Export CSV"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Pembayaran</CardTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              placeholder="Cari pelanggan / invoice / referensi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              className="max-w-xs"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Semua status</option>
              <option value="success">Berhasil</option>
              <option value="pending">Menunggu</option>
              <option value="failed">Gagal</option>
              <option value="expired">Kadaluarsa</option>
            </select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
            <span className="text-muted-foreground text-sm">s/d</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
            <Button size="sm" onClick={() => load(1)}>Terapkan</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Referensi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{new Date(p.createdAt).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="font-medium">
                    {p.customerName ?? "-"}
                    {p.customerNumber && <span className="block text-xs text-muted-foreground">{p.customerNumber}</span>}
                  </TableCell>
                  <TableCell>
                    {p.invoiceNumber ? (
                      <Link href={`/invoices/${p.invoiceId}`} className="font-mono text-sm text-primary hover:underline">
                        {p.invoiceNumber}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="uppercase text-xs">{p.paymentMethod}</TableCell>
                  <TableCell className="text-right">Rp {Number(p.amount).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status) as any}>{statusLabel[p.status] ?? p.status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.gatewayReference ?? "-"}</TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada pembayaran
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>
                  Sebelumnya
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
