"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Server, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Pkg {
  id: string;
  name: string;
  speedMbps: number;
  displaySpeedMbps?: number;
  displayDesc?: string;
  price: number;
  billingCycle: string;
  mikrotikProfile?: string;
  isActive: boolean;
}

interface RouterItem {
  id: string;
  name: string;
}

const PAGE_SIZE = 10;

const CYCLE_LABEL: Record<string, string> = {
  monthly: "Bulanan",
  quarterly: "3 Bulanan",
  yearly: "Tahunan",
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [page, setPage] = useState(1);

  // Modal edit paket
  const [editPkg, setEditPkg] = useState<Pkg | null>(null);
  const [editForm, setEditForm] = useState({ name: "", speedMbps: 0, displaySpeedMbps: 0, displayDesc: "", price: 0, mikrotikProfile: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState("");

  // Modal tambah profile router
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profForm, setProfForm] = useState({ routerId: "", name: "", rateLimit: "" });
  const [savingProf, setSavingProf] = useState(false);
  const [profErr, setProfErr] = useState("");

  function load() {
    api.get("/packages").then((res) => setPackages(res.data.data));
  }
  function loadProfiles() {
    api.get("/routers/profiles/all").then((res) => setProfiles(res.data.data ?? [])).catch(() => {});
  }

  useEffect(() => {
    load();
    loadProfiles();
    api.get("/routers").then((res) => setRouters(res.data.data ?? [])).catch(() => {});
  }, []);

  async function handleDeactivate(id: string) {
    await api.delete(`/packages/${id}`);
    load();
  }

  function openEdit(p: Pkg) {
    setEditErr("");
    setEditPkg(p);
    setEditForm({
      name: p.name,
      speedMbps: p.speedMbps,
      displaySpeedMbps: p.displaySpeedMbps ?? p.speedMbps,
      displayDesc: p.displayDesc ?? "",
      price: Number(p.price),
      mikrotikProfile: p.mikrotikProfile ?? "",
    });
  }

  async function saveEdit() {
    if (!editPkg) return;
    setEditErr("");
    setSavingEdit(true);
    try {
      await api.patch(`/packages/${editPkg.id}`, {
        name: editForm.name,
        speedMbps: Number(editForm.speedMbps),
        displaySpeedMbps: Number(editForm.displaySpeedMbps) || undefined,
        displayDesc: editForm.displayDesc || undefined,
        price: Number(editForm.price),
        mikrotikProfile: editForm.mikrotikProfile || undefined,
      });
      setEditPkg(null);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal menyimpan.";
      setEditErr(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveProfile() {
    setProfErr("");
    if (!profForm.routerId || !profForm.name) {
      setProfErr("Router dan nama profile wajib diisi.");
      return;
    }
    setSavingProf(true);
    try {
      await api.post(`/routers/${profForm.routerId}/profiles`, {
        name: profForm.name,
        rateLimit: profForm.rateLimit || undefined,
      });
      setShowProfileModal(false);
      setProfForm({ routerId: "", name: "", rateLimit: "" });
      loadProfiles();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal membuat profile.";
      setProfErr(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSavingProf(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(packages.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => packages.slice(start, start + PAGE_SIZE), [packages, start]);
  const showingFrom = packages.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, packages.length);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paket Internet</h1>
          <p className="text-muted-foreground">Kelola katalog paket & profile PPPoE</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setProfErr(""); setShowProfileModal(true); }}>
            <Server className="mr-2 h-4 w-4" /> Tambah Profile Router
          </Button>
          <Button asChild>
            <Link href="/packages/new">
              <Plus className="mr-2 h-4 w-4" /> Tambah Paket
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Daftar Paket <span className="text-sm font-normal text-muted-foreground">({packages.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-[180px]">Kecepatan</TableHead>
                  <TableHead className="w-[140px]">Profile Router</TableHead>
                  <TableHead className="w-[110px]">Siklus</TableHead>
                  <TableHead className="w-[130px] text-right">Harga</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[150px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <div>{p.speedMbps} Mbps</div>
                    <div className="text-[11px] text-muted-foreground">tampil: {p.displayDesc ?? "Cocok untuk beberapa perangkat"}</div>
                  </TableCell>
                  <TableCell>
                    {p.mikrotikProfile ? (
                      <Badge variant="outline">{p.mikrotikProfile}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">belum diset</span>
                    )}
                  </TableCell>
                  <TableCell>{CYCLE_LABEL[p.billingCycle] ?? p.billingCycle}</TableCell>
                  <TableCell className="text-right">Rp {Number(p.price).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "success" : "secondary"}>
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {p.isActive && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeactivate(p.id)}>
                        Nonaktifkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
                {packages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Belum ada paket
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {packages.length} paket
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

      {/* Modal Edit Paket */}
      {editPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-bold">Edit Paket</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Paket</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Kecepatan Asli (Mbps)</label>
                  <input
                    type="number"
                    value={editForm.speedMbps}
                    onChange={(e) => setEditForm({ ...editForm, speedMbps: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Internal (rate-limit teknis).</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kecepatan Tampil (up to X Mbps)</label>
                <input
                  type="number"
                  value={editForm.displaySpeedMbps}
                  onChange={(e) => setEditForm({ ...editForm, displaySpeedMbps: Number(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="mis. 20 (tampil: up to 20 Mbps)"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Angka yang dilihat pelanggan di invoice &amp; web. Kosong = pakai kecepatan asli.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi Tampil ke Pelanggan</label>
                <input
                  type="text"
                  value={editForm.displayDesc}
                  onChange={(e) => setEditForm({ ...editForm, displayDesc: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="mis. Cocok untuk beberapa perangkat"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Teks ini menggantikan angka kecepatan di invoice, portal &amp; web. Kosong = "Cocok untuk beberapa perangkat".
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Profile PPPoE (Router)</label>
                <select
                  value={editForm.mikrotikProfile}
                  onChange={(e) => setEditForm({ ...editForm, mikrotikProfile: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Tidak diset --</option>
                  {profiles.map((pr) => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                  {/* jika profile paket saat ini tidak ada di daftar router, tetap tampilkan */}
                  {editForm.mikrotikProfile && !profiles.includes(editForm.mikrotikProfile) && (
                    <option value={editForm.mikrotikProfile}>{editForm.mikrotikProfile}</option>
                  )}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saat pelanggan pindah ke paket ini, profile inilah yang diterapkan di router.
                </p>
              </div>
              {editErr && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editErr}</div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditPkg(null)} disabled={savingEdit}>Batal</Button>
              <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Profile Router */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-bold">Tambah Profile PPPoE Baru</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Membuat profile baru di router. Profile yang sudah ada tidak diubah.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Router <span className="text-red-500">*</span></label>
                <select
                  value={profForm.routerId}
                  onChange={(e) => setProfForm({ ...profForm, routerId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Pilih Router --</option>
                  {routers.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Profile <span className="text-red-500">*</span></label>
                <input
                  value={profForm.name}
                  onChange={(e) => setProfForm({ ...profForm, name: e.target.value })}
                  placeholder="mis. 20M/20M"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rate Limit</label>
                <input
                  value={profForm.rateLimit}
                  onChange={(e) => setProfForm({ ...profForm, rateLimit: e.target.value })}
                  placeholder="mis. 20M/20M (rx/tx)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">Format MikroTik: upload/download, mis. 20M/20M.</p>
              </div>
              {profErr && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{profErr}</div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProfileModal(false)} disabled={savingProf}>Batal</Button>
              <Button onClick={saveProfile} disabled={savingProf}>{savingProf ? "Membuat..." : "Buat Profile"}</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
