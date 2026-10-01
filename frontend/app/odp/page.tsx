"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface ODP {
  id: string;
  name: string;
  totalPorts: number;
  usedPorts: number;
  routerId?: string;
  router?: { name: string };
  technicianId?: string;
  technician?: { name: string };
  latitude?: number;
  longitude?: number;
}

const PAGE_SIZE = 10;

function portColor(used: number, total: number) {
  if (used >= total) return "text-red-600 font-semibold";
  if (used / total >= 0.8) return "text-amber-600 font-semibold";
  return "text-green-600 font-semibold";
}

export default function ODPPage() {
  const [odpList, setOdpList] = useState<ODP[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/odp").then((res) => setOdpList(res.data.data));
  }, []);

  const totalPages = Math.max(1, Math.ceil(odpList.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => odpList.slice(start, start + PAGE_SIZE), [odpList, start]);
  const showingFrom = odpList.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PAGE_SIZE, odpList.length);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ODP</h1>
          <p className="text-muted-foreground">Manajemen Optical Distribution Point</p>
        </div>
        <Link href="/odp/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah ODP
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Daftar ODP <span className="text-sm font-normal text-muted-foreground">({odpList.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-[110px]">Total Port</TableHead>
                  <TableHead className="w-[130px]">Port Terpakai</TableHead>
                  <TableHead className="w-[80px]">Sisa</TableHead>
                  <TableHead className="w-[150px]">Router</TableHead>
                  <TableHead className="w-[150px]">Teknisi</TableHead>
                  <TableHead className="w-[180px]">Koordinat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((odp) => {
                  const used = odp.usedPorts ?? 0;
                  const total = odp.totalPorts;
                  const sisa = total - used;
                  return (
                    <TableRow key={odp.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{odp.name}</TableCell>
                      <TableCell>{total}</TableCell>
                      <TableCell>
                        <span className={portColor(used, total)}>{used} / {total}</span>
                      </TableCell>
                      <TableCell>{sisa}</TableCell>
                      <TableCell>{odp.router?.name ?? "-"}</TableCell>
                      <TableCell>{odp.technician?.name ?? "-"}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {odp.latitude && odp.longitude
                          ? `${odp.latitude}, ${odp.longitude}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {odpList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Tidak ada ODP
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {showingFrom}–{showingTo} dari {odpList.length} ODP
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
