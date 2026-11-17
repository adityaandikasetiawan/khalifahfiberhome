"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Wallet, Send } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Usage {
  costPerMessage: number;
  totalSent: number;
  totalCost: number;
  perMonth: { periode: string; jumlah: number; biaya: number }[];
  perType: { tipe: string; jumlah: number }[];
}

const rupiah = (n: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const typeLabel: Record<string, string> = {
  text: "Teks",
  image: "Gambar",
  document: "Dokumen",
  other: "Lainnya",
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${names[Number(m) - 1] ?? m} ${y}`;
};

export default function WhatsAppUsagePage() {
  const [data, setData] = useState<Usage | null>(null);
  const [cost, setCost] = useState(500);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("cost", String(cost || 0));
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    api
      .get(`/whatsapp/chat/usage?${params.toString()}`)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  };

  // Muat pertama kali.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Biaya WhatsApp</h1>
        <p className="text-muted-foreground">
          Perhitungan penggunaan WhatsApp berdasarkan pesan terkirim ke pelanggan
        </p>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Biaya per Pesan (Rp)</label>
            <Input
              type="number"
              min={0}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Dari Tanggal</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
          <Button onClick={load} disabled={loading}>
            {loading ? "Menghitung..." : "Hitung"}
          </Button>
        </CardContent>
      </Card>

      {/* Ringkasan kartu */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pesan Terkirim</p>
              <p className="text-2xl font-bold">{(data?.totalSent ?? 0).toLocaleString("id-ID")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Biaya per Pesan</p>
              <p className="text-2xl font-bold">{rupiah(data?.costPerMessage ?? cost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Biaya</p>
              <p className="text-2xl font-bold text-amber-700">{rupiah(data?.totalCost ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rincian per bulan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Jumlah Pesan</TableHead>
                  <TableHead className="text-right">Biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.perMonth ?? []).map((r) => (
                  <TableRow key={r.periode}>
                    <TableCell>{monthLabel(r.periode)}</TableCell>
                    <TableCell className="text-right">{r.jumlah.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-medium">{rupiah(r.biaya)}</TableCell>
                  </TableRow>
                ))}
                {(!data || data.perMonth.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      Belum ada data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rincian per tipe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian per Tipe Pesan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.perType ?? []).map((r) => (
                  <TableRow key={r.tipe}>
                    <TableCell>{typeLabel[r.tipe] ?? r.tipe}</TableCell>
                    <TableCell className="text-right">{r.jumlah.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
                {(!data || data.perType.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                      Belum ada data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Biaya dihitung dari pesan yang DIKIRIM sistem ke pelanggan (notifikasi tagihan, pembayaran,
        broadcast, chat admin). Pesan masuk dari pelanggan tidak dikenai biaya.
      </p>
    </AdminLayout>
  );
}
