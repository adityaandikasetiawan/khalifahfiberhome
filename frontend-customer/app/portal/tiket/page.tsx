"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, LifeBuoy } from "lucide-react";
import { api } from "@/lib/api";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Baru",
  in_progress: "Diproses",
  resolved: "Selesai",
  closed: "Ditutup",
};

export default function PortalTiketPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "" });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("portalAccessToken");
    if (!token) {
      router.push("/portal/login");
      return;
    }
    fetchTickets();
  }, [router]);

  const fetchTickets = () => {
    api
      .get("/portal/tickets")
      .then((res) => {
        const data = res.data.data ?? res.data;
        setTickets(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // Fallback: try alternative endpoint
        api
          .get("/tickets?customerId=me")
          .then((res) => {
            const data = res.data.data ?? res.data;
            setTickets(Array.isArray(data) ? data : []);
          })
          .catch(() => setTickets([]));
      })
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    try {
      await api.post("/portal/tickets", {
        subject: form.subject,
        description: form.description,
      });
      setSuccess("Tiket berhasil dibuat! Tim kami akan segera merespons.");
      setForm({ subject: "", description: "" });
      setShowForm(false);
      fetchTickets();
    } catch (err: any) {
      // Fallback endpoint
      try {
        await api.post("/tickets", {
          subject: form.subject,
          description: form.description,
        });
        setSuccess("Tiket berhasil dibuat!");
        setForm({ subject: "", description: "" });
        setShowForm(false);
        fetchTickets();
      } catch {
        setSuccess("");
        alert(err?.response?.data?.message ?? "Gagal membuat tiket. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tiket Support</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lapor gangguan atau minta bantuan teknis
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Buat Tiket
          </button>
        </div>

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Create Ticket Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Buat Tiket Baru</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="subject" className="text-sm font-medium">
                  Subjek
                </label>
                <input
                  id="subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Contoh: Internet mati, koneksi lambat, dll"
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="text-sm font-medium">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Jelaskan masalah yang Anda alami secara detail"
                  rows={4}
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim Tiket"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="mt-12 text-center">
            <LifeBuoy className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Belum ada tiket</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
