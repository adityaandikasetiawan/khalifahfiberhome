"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  customerId: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

const priorityVariant = (priority: string) => {
  switch (priority) {
    case "low": return "secondary";
    case "medium": return "warning";
    case "high": return "danger";
    default: return "secondary";
  }
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

const statusVariant = (status: string) => {
  switch (status) {
    case "open": return "warning";
    case "in_progress": return "default";
    case "resolved": return "success";
    case "closed": return "secondary";
    default: return "secondary";
  }
};

const STATUS_LABEL: Record<string, string> = {
  open: "Terbuka",
  in_progress: "Diproses",
  resolved: "Selesai",
  closed: "Ditutup",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params: any = {};
    if (filter) params.status = filter;
    api.get("/tickets", { params }).then((res) => setTickets(res.data.data ?? []));
  }, [filter]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => tickets.slice(start, start + PAGE_SIZE), [tickets, start]);
  const showingFrom = tickets.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, tickets.length);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tiket Gangguan</h1>
          <p className="text-muted-foreground">Manajemen tiket laporan gangguan pelanggan</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="open">Terbuka</option>
            <option value="in_progress">Diproses</option>
            <option value="resolved">Selesai</option>
            <option value="closed">Ditutup</option>
          </select>
          <Button asChild>
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" /> Buat Tiket
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Daftar Tiket <span className="text-sm font-normal text-muted-foreground">({tickets.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Subjek</TableHead>
                  <TableHead className="w-[120px]">Pelanggan</TableHead>
                  <TableHead className="w-[100px]">Prioritas</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[120px]">Ditangani</TableHead>
                  <TableHead className="w-[110px]">Dibuat</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell className="font-mono text-xs">{ticket.customerId.slice(0, 8)}…</TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(ticket.priority) as any}>
                        {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(ticket.status) as any}>
                        {STATUS_LABEL[ticket.status] ?? ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{ticket.assignedTo ?? "-"}</TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/tickets/${ticket.id}`} className="text-sm text-primary hover:underline">
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Tidak ada tiket
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {tickets.length} tiket
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
