"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Wifi, WifiOff, TestTube } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RouterItem {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  useTls: boolean;
  isActive: boolean;
  notes?: string;
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; identity?: string; error?: string }>>({});

  useEffect(() => {
    api.get("/routers").then((res) => setRouters(res.data.data));
  }, []);

  async function handleTest(id: string) {
    setTesting(id);
    try {
      const res = await api.post(`/routers/${id}/test`);
      setTestResult((prev) => ({ ...prev, [id]: res.data.data }));
    } catch (err: any) {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, error: err?.response?.data?.message ?? "Gagal test" } }));
    } finally {
      setTesting(null);
    }
  }

  async function handleDeactivate(id: string) {
    await api.delete(`/routers/${id}`);
    setRouters((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Router MikroTik</h1>
          <p className="text-muted-foreground">Kelola perangkat router untuk otomasi PPPoE</p>
        </div>
        <Button asChild>
          <Link href="/routers/new">
            <Plus className="mr-2 h-4 w-4" /> Tambah Router
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Router</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>TLS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Koneksi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono text-sm">{r.host}</TableCell>
                  <TableCell>{r.port}</TableCell>
                  <TableCell>{r.useTls ? "Ya" : "Tidak"}</TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "success" : "secondary"}>
                      {r.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {testResult[r.id] ? (
                      testResult[r.id].success ? (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <Wifi className="h-3 w-3" /> {testResult[r.id].identity}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-destructive">
                          <WifiOff className="h-3 w-3" /> {testResult[r.id].error?.slice(0, 30)}
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={testing === r.id}
                      onClick={() => handleTest(r.id)}
                    >
                      <TestTube className="mr-1 h-3 w-3" />
                      {testing === r.id ? "..." : "Test"}
                    </Button>
                    <Link href={`/routers/${r.id}`} className="text-sm text-primary hover:underline">
                      Detail
                    </Link>
                    {r.isActive && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeactivate(r.id)}>
                        Nonaktifkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {routers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada router. Tambahkan router MikroTik pertama.
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
