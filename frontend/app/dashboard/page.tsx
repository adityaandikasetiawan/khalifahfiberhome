"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, AlertTriangle, FileText, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Summary {
  unpaidCount: number;
  overdueCount: number;
  revenueThisMonth: number;
}

interface ChartData {
  label: string;
  revenue: number;
  count: number;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "paid": return "success";
    case "unpaid": return "warning";
    case "overdue": return "danger";
    case "cancelled": return "secondary";
    default: return "outline";
  }
};

const statusLabel: Record<string, string> = {
  paid: "Lunas",
  unpaid: "Belum Bayar",
  overdue: "Jatuh Tempo",
  cancelled: "Dibatalkan",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/invoices/summary").then((res) => setSummary(res.data.data));
    api.get("/invoices").then((res) => setInvoices(res.data.data));
    api.get("/reports/revenue/chart").then((res) => setChartData(res.data.data)).catch(() => {});
  }, []);

  const filtered = invoices.filter((inv) =>
    inv.subscription?.customer?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan billing dan tagihan pelanggan</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {(summary?.revenueThisMonth ?? 0).toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Bayar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.unpaidCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary?.overdueCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoice</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Pendapatan 12 Bulan Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Pendapatan"]}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Bar dataKey="revenue" fill="hsl(160, 78%, 24%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              Belum ada data pendapatan untuk ditampilkan
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Invoice Terbaru</CardTitle>
            <Input
              placeholder="Cari nama pelanggan..."
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
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-right">Tagihan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 10).map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.subscription?.customer?.name}</TableCell>
                  <TableCell>{inv.subscription?.package?.name}</TableCell>
                  <TableCell>{new Date(inv.dueDate).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.status) as any}>{statusLabel[inv.status] ?? inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/invoices/${inv.id}`} className="text-sm text-primary hover:underline">
                      Lihat
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada data tagihan
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
