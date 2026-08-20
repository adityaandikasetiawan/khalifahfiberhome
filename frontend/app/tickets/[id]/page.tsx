"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Technician {
  id: string;
  name: string;
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

export default function TicketDetailPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    if (params?.id) {
      api.get(`/tickets/${params.id}`).then((res) => setTicket(res.data.data));
    }
  }

  useEffect(() => {
    load();
    api.get("/users", { params: { role: "technician" } }).then((res) => setTechnicians(res.data.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  async function handleAssign() {
    if (!selectedTechnician) return;
    setLoading(true);
    setError("");
    try {
      await api.patch(`/tickets/${params.id}/assign`, { technicianId: selectedTechnician });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal assign teknisi");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve() {
    setLoading(true);
    setError("");
    try {
      await api.patch(`/tickets/${params.id}/resolve`, { notes: resolveNotes });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal menandai selesai");
    } finally {
      setLoading(false);
    }
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Detail Tiket</h1>
        <p className="text-muted-foreground">{ticket.subject}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
              <Badge variant={statusVariant(ticket.status) as any}>{STATUS_LABEL[ticket.status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pelanggan</p>
                <p className="font-medium">{ticket.customer?.name ?? ticket.customerId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Prioritas</p>
                <Badge variant={priorityVariant(ticket.priority) as any}>{ticket.priority}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Assigned To</p>
                <p className="font-medium">{ticket.assignedTo ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dibuat</p>
                <p className="font-medium">{new Date(ticket.createdAt).toLocaleString("id-ID")}</p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-muted-foreground">Diselesaikan</p>
                  <p className="font-medium">{new Date(ticket.resolvedAt).toLocaleString("id-ID")}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Deskripsi</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.photoUrl && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Foto</p>
                  <img src={ticket.photoUrl} alt="Foto tiket" className="max-w-full rounded-md border" />
                </div>
              </>
            )}

            {ticket.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Catatan Penyelesaian</p>
                  <p className="text-sm whitespace-pre-wrap">{ticket.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {ticket.status === "open" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assign Teknisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>-- Pilih Teknisi --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
                <Button onClick={handleAssign} disabled={loading || !selectedTechnician} className="w-full">
                  {loading ? "Memproses..." : "Assign Teknisi"}
                </Button>
              </CardContent>
            </Card>
          )}

          {ticket.status === "in_progress" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tandai Selesai</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Catatan penyelesaian..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button onClick={handleResolve} disabled={loading} className="w-full">
                  {loading ? "Memproses..." : "Tandai Selesai"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
