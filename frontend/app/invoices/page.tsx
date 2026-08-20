"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
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

const statusVariant = (status: string) => {
  switch (status) {
    case "paid": return "success";
    case "unpaid": return "warning";
    case "overdue": return "danger";
    default: return "secondary";
  }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/invoices").then((res) => setInvoices(res.data.data));
  }, []);

  const filtered = invoices.filter((inv) =>
    inv.subscription?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
        <p className="text-muted-foreground">Semua tagihan pelanggan</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Daftar Invoice</CardTitle>
            <Input
              placeholder="Cari pelanggan atau nomor invoice..."
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
                <TableHead>No. Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-right">Tagihan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                  <TableCell className="font-medium">{inv.subscription?.customer?.name}</TableCell>
                  <TableCell>{inv.subscription?.package?.name}</TableCell>
                  <TableCell>{new Date(inv.dueDate).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.status) as any}>{inv.status}</Badge>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada invoice
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
