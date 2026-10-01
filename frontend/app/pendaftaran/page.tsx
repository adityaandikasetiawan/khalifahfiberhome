"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PendingReg {
  subscriptionId: string;
  customerId: string;
  customerNumber: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerStatus: string;
  package: { name: string; speedMbps: number; price: number } | null;
}

interface RouterItem {
  id: string;
  name: string;
}

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  pending_verification: "Belum verifikasi email",
  pending_active: "Sudah bayar - menunggu approval",
};

export default function PendaftaranPage() {
  const [rows, setRows] = useState<PendingReg[]>([]);
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<PendingReg | null>(null);
  const [form, setForm] = useState({ routerId: "", pppoeUsername: "", pppoePassword: "", mikrotikProfile: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/registrations/pending");
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get("/routers").then((res) => setRouters(res.data.data ?? [])).catch(() => {});
  }, []);

  async function loadProfiles(routerId: string) {
    if (!routerId || profiles[routerId]) return;
    try {
      const res = await api.get(`/routers/${routerId}/profiles`);
      const names = (res.data.data ?? []).map((p: any) => p.name);
      setProfiles((prev) => ({ ...prev, [routerId]: names }));
    } catch {
      setProfiles((prev) => ({ ...prev, [routerId]: [] }));
    }
  }

  function openApprove(row: PendingReg) {
    setActive(row);
    setError("");
    setForm({
      routerId: "",
      pppoeUsername: "",
      pppoePassword: "",
      mikrotikProfile: "",
    });
  }

  async function submitApprove() {
    if (!active) return;
    setError("");
    if (!form.routerId || !form.pppoeUsername) {
      setError("Router dan username PPPoE wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/registrations/${active.subscriptionId}/approve`, {
        routerId: form.routerId,
        pppoeUsername: form.pppoeUsername,
        pppoePassword: form.pppoePassword || undefined,
        mikrotikProfile: form.mikrotikProfile || undefined,
      });
      setActive(null);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal approve. Coba lagi.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => rows.slice(start, start + PAGE_SIZE), [rows, start]);
  const showingFrom = rows.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, rows.length);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pendaftaran Pelanggan Baru</h1>
          <p className="text-muted-foreground">
            Approve pelanggan yang sudah membayar registrasi untuk mengaktifkan layanan.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>Muat ulang</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Menunggu Approval <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[130px]">No. Pelanggan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-[180px]">Kontak</TableHead>
                  <TableHead className="w-[200px]">Paket</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                  <TableHead className="w-[170px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.subscriptionId} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{r.customerNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.address ?? "-"}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{r.phone}</div>
                    <div className="text-xs text-muted-foreground">{r.email ?? "-"}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.package ? `${r.package.name} (${r.package.speedMbps} Mbps)` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.customerStatus === "pending_active" ? "success" : "outline"}>
                      {STATUS_LABEL[r.customerStatus] ?? r.customerStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => openApprove(r)}
                      disabled={r.customerStatus !== "pending_active"}
                      title={r.customerStatus !== "pending_active" ? "Pelanggan belum bayar registrasi" : ""}
                    >
                      Approve & Aktifkan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Tidak ada pendaftaran menunggu approval
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {rows.length} pendaftaran
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

      {/* Modal approve */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-bold">Approve: {active.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {active.customerNumber} &middot; {active.package?.name}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Router MikroTik <span className="text-red-500">*</span></label>
                <select
                  value={form.routerId}
                  onChange={(e) => {
                    setForm({ ...form, routerId: e.target.value, mikrotikProfile: "" });
                    loadProfiles(e.target.value);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Pilih Router --</option>
                  {routers.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username PPPoE <span className="text-red-500">*</span></label>
                <input
                  value={form.pppoeUsername}
                  onChange={(e) => setForm({ ...form, pppoeUsername: e.target.value })}
                  placeholder="mis. rumah41"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password PPPoE</label>
                <input
                  value={form.pppoePassword}
                  onChange={(e) => setForm({ ...form, pppoePassword: e.target.value })}
                  placeholder="Kosongkan = sama dengan username"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Profile PPPoE</label>
                {form.routerId && profiles[form.routerId]?.length ? (
                  <select
                    value={form.mikrotikProfile}
                    onChange={(e) => setForm({ ...form, mikrotikProfile: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">-- Pilih Profile (default) --</option>
                    {profiles[form.routerId].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.mikrotikProfile}
                    onChange={(e) => setForm({ ...form, mikrotikProfile: e.target.value })}
                    placeholder="Nama profile di router"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                )}
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActive(null)} disabled={submitting}>
                Batal
              </Button>
              <Button onClick={submitApprove} disabled={submitting}>
                {submitting ? "Memproses..." : "Approve & Aktifkan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
