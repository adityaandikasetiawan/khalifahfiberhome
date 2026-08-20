"use client";

import { useEffect, useState } from "react";
import { Download, TrendingUp, AlertTriangle, Users, UserX } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function downloadExcel(path: string, filename: string) {
  const res = await api.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [churn, setChurn] = useState<any>(null);

  useEffect(() => {
    api.get("/reports/revenue").then((res) => setRevenue(res.data.data));
    api.get("/reports/overdue").then((res) => setOverdue(res.data.data));
    api.get("/reports/churn").then((res) => setChurn(res.data.data));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground">Ringkasan pendapatan dan status pelanggan</p>
        </div>
        <Button variant="outline" onClick={() => downloadExcel("/reports/revenue/export", "laporan-pendapatan.xlsx")}>
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(revenue?.totalRevenue ?? 0).toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Lunas</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue?.paidInvoiceCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churn?.active ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{churn?.suspended ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pelanggan Overdue</CardTitle>
            <Button size="sm" variant="outline" onClick={() => downloadExcel("/reports/overdue/export", "daftar-overdue.xlsx")}>
              <Download className="mr-2 h-3 w-3" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-right">Tagihan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdue.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.subscription?.customer?.name}</TableCell>
                  <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                  <TableCell>{new Date(inv.dueDate).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
              {overdue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Tidak ada tagihan overdue
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
