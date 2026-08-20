"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

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

function portColor(used: number, total: number) {
  if (used >= total) return "text-red-600 font-semibold";
  if (used / total >= 0.8) return "text-amber-600 font-semibold";
  return "text-green-600 font-semibold";
}

export default function ODPPage() {
  const [odpList, setOdpList] = useState<ODP[]>([]);

  useEffect(() => {
    api.get("/odp").then((res) => setOdpList(res.data.data));
  }, []);

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
          <CardTitle className="text-lg">Daftar ODP</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Total Port</TableHead>
                <TableHead>Port Terpakai</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Router</TableHead>
                <TableHead>Teknisi</TableHead>
                <TableHead>Koordinat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {odpList.map((odp) => {
                const used = odp.usedPorts ?? 0;
                const total = odp.totalPorts;
                const sisa = total - used;
                return (
                  <TableRow key={odp.id}>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada ODP
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
