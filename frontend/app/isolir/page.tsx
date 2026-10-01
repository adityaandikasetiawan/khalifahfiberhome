"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Task {
  id: string;
  subscriptionId: string;
  type: "suspend" | "activate";
  status: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
}

interface Technician {
  id: string;
  name: string;
}

const PAGE_SIZE = 10;

const TYPE_LABEL: Record<string, string> = { suspend: "Isolir", activate: "Aktivasi" };
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "Ditugaskan",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

export default function IsolirTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);

  async function load() {
    const res = await api.get("/isolir-tasks", { params: { status: filter || undefined } });
    setTasks(res.data.data);
  }

  useEffect(() => {
    load();
    api.get("/users", { params: { role: "technician" } }).then((res) => setTechnicians(res.data.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function completeTask(id: string) {
    await api.patch(`/isolir-tasks/${id}/complete`);
    load();
  }

  async function assignTask(id: string, technicianId: string) {
    if (!technicianId) return;
    await api.patch(`/isolir-tasks/${id}/assign`, { technicianId });
    load();
  }

  function technicianName(id?: string) {
    return technicians.find((t) => t.id === id)?.name;
  }

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => tasks.slice(start, start + PAGE_SIZE), [tasks, start]);
  const showingFrom = tasks.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, tasks.length);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tugas Isolir & Aktivasi</h1>
          <p className="text-muted-foreground">Manajemen tugas teknisi lapangan</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">Ditugaskan</option>
          <option value="done">Selesai</option>
          <option value="">Semua</option>
        </select>
      </div>

      {technicians.length === 0 && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
          Belum ada user dengan role teknisi. Assignment tidak akan bisa dipilih sebelum ada user teknisi terdaftar.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Daftar Tugas <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[110px]">Jenis</TableHead>
                  <TableHead className="w-[150px]">Subscription ID</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="w-[180px]">Ditugaskan ke</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[130px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Badge variant={t.type === "suspend" ? "danger" : "success"}>
                        {TYPE_LABEL[t.type]}
                      </Badge>
                    </TableCell>
                  <TableCell className="font-mono text-xs">{t.subscriptionId.slice(0, 8)}...</TableCell>
                  <TableCell className="text-muted-foreground">{t.notes ?? "-"}</TableCell>
                  <TableCell>
                    {t.status === "pending" ? (
                      <select
                        defaultValue=""
                        onChange={(e) => assignTask(t.id, e.target.value)}
                        className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="" disabled>-- Assign --</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>{tech.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm">{technicianName(t.assignedTo) ?? "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS_LABEL[t.status] ?? t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {(t.status === "pending" || t.status === "in_progress") && (
                      <Button size="sm" variant="outline" onClick={() => completeTask(t.id)}>
                        Selesaikan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Tidak ada tugas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {tasks.length} tugas
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
