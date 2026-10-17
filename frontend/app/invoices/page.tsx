"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, Download } from "lucide-react";
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

interface SubOption {
  id: string;
  status: string;
  customer: { name: string; customerNumber: string };
  package: { name: string; price: number };
}

interface ItemForm {
  description: string;
  qty: number;
  unitPrice: number;
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

  // State form "Buat Invoice Manual"
  const [showCreate, setShowCreate] = useState(false);
  const [subs, setSubs] = useState<SubOption[]>([]);
  const [subId, setSubId] = useState("");
  const [subSearch, setSubSearch] = useState(""); // teks pencarian pelanggan
  const [subOpen, setSubOpen] = useState(false); // tampilkan dropdown hasil
  const [items, setItems] = useState<ItemForm[]>([{ description: "", qty: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Download PDF invoice (butuh JWT -> ambil blob via axios lalu picu unduhan).
  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    setDownloadingId(id);
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh PDF invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  const loadInvoices = () => {
    api.get("/invoices").then((res) => setInvoices(res.data.data ?? []));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Ambil daftar subscription saat modal dibuka pertama kali.
  const openCreate = () => {
    setFormErr("");
    setShowCreate(true);
    if (subs.length === 0) {
      api
        .get("/subscriptions")
        .then((res) => setSubs(res.data.data ?? []))
        .catch(() => setFormErr("Gagal memuat daftar pelanggan"));
    }
  };

  // Label tampilan untuk sebuah subscription (dipakai di input & daftar hasil).
  const subLabel = (s: SubOption) =>
    `${s.customer?.customerNumber ?? ""} — ${s.customer?.name ?? ""} (${s.package?.name ?? "-"})`;

  // Daftar pelanggan yang cocok dengan teks pencarian (nama / no. pelanggan / paket).
  const filteredSubs = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    if (!q) return subs.slice(0, 50);
    return subs
      .filter((s) => {
        const hay = `${s.customer?.customerNumber ?? ""} ${s.customer?.name ?? ""} ${s.package?.name ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 50);
  }, [subs, subSearch]);

  // Saat pilih pelanggan, isi otomatis 1 item langganan sesuai paketnya.
  const onSelectSub = (id: string) => {
    setSubId(id);
    const s = subs.find((x) => x.id === id);
    if (s) {
      setSubSearch(subLabel(s));
      setSubOpen(false);
      setItems([
        { description: `Langganan ${s.package?.name ?? ""}`.trim(), qty: 1, unitPrice: Number(s.package?.price ?? 0) },
      ]);
    }
  };

  const addItem = () => setItems((prev) => [...prev, { description: "", qty: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<ItemForm>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const formTotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0), 0),
    [items],
  );

  const resetForm = () => {
    setSubId("");
    setSubSearch("");
    setSubOpen(false);
    setItems([{ description: "", qty: 1, unitPrice: 0 }]);
    setFormErr("");
  };

  const submitCreate = async () => {
    setFormErr("");
    if (!subId) {
      setFormErr("Pilih pelanggan terlebih dahulu");
      return;
    }
    const cleanItems = items
      .map((it) => ({
        description: it.description.trim(),
        qty: Math.max(1, Math.floor(Number(it.qty) || 0)),
        unitPrice: Math.max(0, Number(it.unitPrice) || 0),
      }))
      .filter((it) => it.description.length > 0);
    if (cleanItems.length === 0) {
      setFormErr("Minimal 1 item dengan deskripsi harus diisi");
      return;
    }
    setSaving(true);
    try {
      await api.post("/invoices", { subscriptionId: subId, items: cleanItems });
      setShowCreate(false);
      resetForm();
      loadInvoices();
    } catch (e: any) {
      setFormErr(e?.response?.data?.message ?? "Gagal membuat invoice");
    } finally {
      setSaving(false);
    }
  };

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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
          <p className="text-muted-foreground">Semua tagihan pelanggan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Buat Invoice Manual
        </Button>
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
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          disabled={downloadingId === inv.id}
                          className="inline-flex items-center text-sm text-primary hover:underline disabled:opacity-50"
                          title="Download PDF"
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          {downloadingId === inv.id ? "..." : "PDF"}
                        </button>
                        <Link href={`/invoices/${inv.id}`} className="text-sm text-primary hover:underline">
                          Detail
                        </Link>
                      </div>
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-bold">Buat Invoice Manual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tagihan tambahan di luar siklus bulanan (mis. biaya instalasi, perangkat, atau tagihan menyusul).
            </p>

            <div className="mt-4 space-y-4">
              <div className="relative">
                <label className="mb-1 block text-sm font-medium">Pelanggan</label>
                <input
                  value={subSearch}
                  onChange={(e) => {
                    setSubSearch(e.target.value);
                    setSubOpen(true);
                    if (subId) setSubId(""); // reset pilihan saat teks diubah
                  }}
                  onFocus={() => setSubOpen(true)}
                  placeholder="Ketik nama / no. pelanggan untuk mencari..."
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  autoComplete="off"
                />
                {subOpen && (
                  <>
                    {/* klik di luar menutup daftar */}
                    <div className="fixed inset-0 z-10" onClick={() => setSubOpen(false)} />
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-background shadow-lg">
                      {filteredSubs.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          {subs.length === 0 ? "Memuat pelanggan..." : "Tidak ada pelanggan cocok"}
                        </div>
                      ) : (
                        filteredSubs.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onSelectSub(s.id)}
                            className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted ${
                              s.id === subId ? "bg-muted" : ""
                            }`}
                          >
                            <span className="font-medium">
                              {s.customer?.customerNumber} — {s.customer?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">{s.package?.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium">Item Tagihan</label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="Deskripsi (mis. Biaya instalasi)"
                        className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                        placeholder="Qty"
                        className="h-10 w-16 rounded-md border border-input bg-background px-2 text-sm"
                        title="Jumlah"
                      />
                      <input
                        type="number"
                        min={0}
                        value={it.unitPrice}
                        onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                        placeholder="Harga"
                        className="h-10 w-32 rounded-md border border-input bg-background px-3 text-sm"
                        title="Harga satuan (Rp)"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted disabled:opacity-40"
                        title="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium">Total</span>
                <span className="font-semibold">Rp {formTotal.toLocaleString("id-ID")}</span>
              </div>

              {formErr && <p className="text-sm text-red-600">{formErr}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Batal
              </Button>
              <Button onClick={submitCreate} disabled={saving}>
                {saving ? "Menyimpan..." : "Buat Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
