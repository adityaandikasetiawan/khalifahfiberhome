"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  customerId: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  createdAt: string;
}

const priorityVariant = (priority: string) => {
  switch (priority) {
    case "low": return "secondary";
    case "medium": return "warning";
    case "high": return "danger";
    default: return "secondary";
  }
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
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params: any = {};
    if (filter) params.status = filter;
    api.get("/tickets", { params }).then((res) => setTickets(res.data.data));
  }, [filter]);

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
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Semua Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <Link href="/tickets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Tiket
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell className="font-mono text-xs">{ticket.customerId.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant(ticket.priority) as any}>{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(ticket.status) as any}>{STATUS_LABEL[ticket.status]}</Badge>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada tiket
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
