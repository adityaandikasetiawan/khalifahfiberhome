"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Wifi, ChevronLeft, ChevronRight } from "lucide-react";
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
  isActive: boolean;
}

interface ActiveConn {
  name: string;
  address: string;
  uptime: string;
  service: string;
}

const PAGE_SIZE = 10;

export default function MonitoringPage() {
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<string>("");
  const [connections, setConnections] = useState<ActiveConn[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/routers").then((res) => {
      const active = res.data.data.filter((r: any) => r.isActive);
      setRouters(active);
      if (active.length > 0) setSelectedRouter(active[0].id);
    });
  }, []);

  async function loadConnections() {
    if (!selectedRouter) return;
    setLoading(true);
    try {
      const res = await api.get(`/routers/${selectedRouter}/active-connections`);
      setConnections(res.data.data);
      setLastRefresh(new Date().toLocaleTimeString("id-ID"));
    } catch {
      setConnections([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedRouter) loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouter]);

  const filtered = connections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setPage(1);
  }, [search, selectedRouter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => filtered.slice(start, start + PAGE_SIZE), [filtered, start]);
  const showingFrom = filtered.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, filtered.length);

  const currentRouter = routers.find((r) => r.id === selectedRouter);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring Koneksi</h1>
          <p className="text-muted-foreground">Pantau koneksi PPPoE aktif per router</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRouter}
            onChange={(e) => setSelectedRouter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {routers.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.host})</option>
            ))}
          </select>
          <Button variant="outline" onClick={loadConnections} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Router Aktif</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentRouter?.name ?? "—"}</div>
            <p className="text-xs text-muted-foreground font-mono">{currentRouter?.host}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Koneksi Online</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{connections.length}</div>
            <p className="text-xs text-muted-foreground">pelanggan terhubung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terakhir Diperbarui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastRefresh || "—"}</div>
            <p className="text-xs text-muted-foreground">data real-time dari router</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Koneksi PPPoE Aktif{" "}
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
            <input
              type="text"
              placeholder="Cari username atau IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Username PPPoE</TableHead>
                  <TableHead className="w-[160px]">IP Address</TableHead>
                  <TableHead className="w-[140px]">Uptime</TableHead>
                  <TableHead className="w-[120px]">Service</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((c, i) => (
                  <TableRow key={i} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-sm">{c.address}</TableCell>
                    <TableCell>{c.uptime}</TableCell>
                    <TableCell>{c.service}</TableCell>
                    <TableCell>
                      <Badge variant="success">Online</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      {loading ? "Memuat data dari router..." : connections.length === 0 ? "Tidak ada koneksi aktif atau router belum terhubung" : "Tidak ditemukan"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {filtered.length} koneksi
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
