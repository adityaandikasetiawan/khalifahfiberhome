"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Wifi, WifiOff, Users, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface Profile {
  name: string;
  localAddress?: string;
  remoteAddress?: string;
  rateLimit?: string;
}

interface ActiveConn {
  name: string;
  address: string;
  uptime: string;
  service: string;
}

export default function RouterDetailPage() {
  const params = useParams();
  const nav = useRouter();
  const [router, setRouter] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<ActiveConn[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingConns, setLoadingConns] = useState(false);

  useEffect(() => {
    if (params?.id) {
      api.get(`/routers/${params.id}`).then((res) => {
        setRouter(res.data.data);
        setForm(res.data.data);
      });
    }
  }, [params?.id]);

  async function handleTest() {
    setTesting(true);
    try {
      const res = await api.post(`/routers/${params.id}/test`);
      setTestResult(res.data.data);
    } catch (err: any) {
      setTestResult({ success: false, error: err?.response?.data?.message ?? "Gagal" });
    } finally {
      setTesting(false);
    }
  }

  async function loadProfiles() {
    setLoadingProfiles(true);
    try {
      const res = await api.get(`/routers/${params.id}/profiles`);
      setProfiles(res.data.data);
    } catch {}
    setLoadingProfiles(false);
  }

  async function loadConnections() {
    setLoadingConns(true);
    try {
      const res = await api.get(`/routers/${params.id}/active-connections`);
      setConnections(res.data.data);
    } catch {}
    setLoadingConns(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { id, createdAt, updatedAt, ...dto } = form;
      await api.patch(`/routers/${params.id}`, dto);
      setRouter(form);
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  if (!router) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{router.name}</h1>
          <p className="text-muted-foreground font-mono">{router.host}:{router.port}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? "Testing..." : "Test Koneksi"}
          </Button>
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? "Batal" : "Edit"}
          </Button>
        </div>
      </div>

      {testResult && (
        <Card className={`mb-4 ${testResult.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="p-4 flex items-center gap-2">
            {testResult.success ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">Terhubung! Identity: <strong>{testResult.identity}</strong></span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">Gagal: {testResult.error}</span>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {editing ? (
        <Card className="mb-6 max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg">Edit Router</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Host</Label>
                <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Username</p>
              <p className="font-medium">{router.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground">TLS</p>
              <p className="font-medium">{router.useTls ? "Ya" : "Tidak"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={router.isActive ? "success" : "secondary"}>{router.isActive ? "Aktif" : "Nonaktif"}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Catatan</p>
              <p className="font-medium">{router.notes || "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> PPPoE Profiles
              </CardTitle>
              <Button size="sm" variant="outline" onClick={loadProfiles} disabled={loadingProfiles}>
                {loadingProfiles ? "Loading..." : "Muat"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {profiles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.rateLimit || "—"}</TableCell>
                      <TableCell className="text-xs">{p.localAddress || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Klik "Muat" untuk melihat profiles dari router</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Koneksi Aktif
              </CardTitle>
              <Button size="sm" variant="outline" onClick={loadConnections} disabled={loadingConns}>
                {loadingConns ? "Loading..." : "Muat"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {connections.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Uptime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs">{c.address}</TableCell>
                      <TableCell className="text-xs">{c.uptime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Klik "Muat" untuk melihat koneksi aktif</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
