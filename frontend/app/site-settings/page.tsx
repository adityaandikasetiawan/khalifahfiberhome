"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Building2, Image, MessageSquare, Star, Globe, Plus, Trash2 } from "lucide-react";

type TabKey = "company" | "hero_slides" | "features" | "testimonials" | "social_links";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "company", label: "Informasi Perusahaan", icon: Building2 },
  { key: "hero_slides", label: "Hero Slider", icon: Image },
  { key: "features", label: "Keunggulan", icon: Star },
  { key: "testimonials", label: "Testimoni", icon: MessageSquare },
  { key: "social_links", label: "Media Sosial", icon: Globe },
];

export default function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("company");
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/site-settings").then((res) => {
      setSettings(res.data.data);
    });
  }, []);

  async function handleSave(key: string, value: any) {
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/site-settings/${key}`, { value });
      setMessage("Berhasil disimpan!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Gagal menyimpan. Coba lagi.");
    }
    setSaving(false);
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Situs</h1>
        <p className="text-muted-foreground">Kelola konten website publik dari sini</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-md p-3 text-sm ${message.includes("Berhasil") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-56 flex lg:flex-col gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "company" && <CompanyForm data={settings.company} onSave={(v) => handleSave("company", v)} saving={saving} />}
          {activeTab === "hero_slides" && <HeroSlidesForm data={settings.hero_slides} onSave={(v) => handleSave("hero_slides", v)} saving={saving} />}
          {activeTab === "features" && <FeaturesForm data={settings.features} onSave={(v) => handleSave("features", v)} saving={saving} />}
          {activeTab === "testimonials" && <TestimonialsForm data={settings.testimonials} onSave={(v) => handleSave("testimonials", v)} saving={saving} />}
          {activeTab === "social_links" && <SocialLinksForm data={settings.social_links} onSave={(v) => handleSave("social_links", v)} saving={saving} />}
        </div>
      </div>
    </AdminLayout>
  );
}

function CompanyForm({ data, onSave, saving }: { data: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState(data || {});
  useEffect(() => { if (data) setForm(data); }, [data]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Informasi Perusahaan</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nama Perusahaan</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Tagline</Label><Input value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
        </div>
        <div><Label>Deskripsi</Label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Alamat</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>No. Telepon</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>WhatsApp (format: 628xxx)</Label><Input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <Button onClick={() => onSave(form)} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Simpan"}</Button>
      </CardContent>
    </Card>
  );
}

function HeroSlidesForm({ data, onSave, saving }: { data: any; onSave: (v: any) => void; saving: boolean }) {
  const [slides, setSlides] = useState<any[]>(data || []);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadErr, setUploadErr] = useState("");
  useEffect(() => { if (data) setSlides(data); }, [data]);

  function updateSlide(index: number, field: string, value: string) {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  }

  async function handleUpload(index: number, file: File) {
    setUploadErr("");
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr("Ukuran file maksimal 5 MB.");
      return;
    }
    setUploading(index);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/site-settings/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateSlide(index, "image", res.data.data.url);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal upload gambar.";
      setUploadErr(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setUploading(null);
    }
  }

  const mediaBase = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const imgSrc = (url?: string) => (!url ? "" : url.startsWith("http") ? url : `${mediaBase}${url}`);

  function addSlide() {
    setSlides([...slides, { badge: "", title: "", highlight: "", subtitle: "", description: "", image: "", ctaText: "Daftar Sekarang", ctaLink: "/daftar", ctaSecondaryText: "", ctaSecondaryLink: "", statValue: "", statUnit: "", statLabel: "" }]);
  }

  function removeSlide(index: number) {
    setSlides(slides.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Hero Slider Banner</CardTitle>
        <Button size="sm" variant="outline" onClick={addSlide}><Plus className="mr-1 h-3 w-3" /> Tambah Slide</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {slides.map((slide, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Slide {i + 1}</span>
              {slides.length > 1 && <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => removeSlide(i)}><Trash2 className="h-3 w-3" /></Button>}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label className="text-xs">Badge</Label><Input value={slide.badge || ""} onChange={(e) => updateSlide(i, "badge", e.target.value)} placeholder="Internet Fiber Optic" /></div>
              <div><Label className="text-xs">Title</Label><Input value={slide.title || ""} onChange={(e) => updateSlide(i, "title", e.target.value)} placeholder="Internet" /></div>
              <div><Label className="text-xs">Highlight (warna gradient)</Label><Input value={slide.highlight || ""} onChange={(e) => updateSlide(i, "highlight", e.target.value)} placeholder="Cepat & Stabil" /></div>
              <div><Label className="text-xs">Subtitle</Label><Input value={slide.subtitle || ""} onChange={(e) => updateSlide(i, "subtitle", e.target.value)} placeholder="Tanpa Batas" /></div>
            </div>
            <div><Label className="text-xs">Deskripsi</Label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={slide.description || ""} onChange={(e) => updateSlide(i, "description", e.target.value)} /></div>

            {/* Upload gambar banner */}
            <div className="rounded-md border border-dashed p-3">
              <Label className="text-xs">Gambar Banner (maks 5MB, otomatis dikonversi ke WebP)</Label>
              <div className="mt-2 flex items-center gap-3">
                {slide.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgSrc(slide.image)} alt={`Slide ${i + 1}`} className="h-16 w-28 rounded object-cover border" />
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded border bg-muted text-[10px] text-muted-foreground">Belum ada</div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(i, f); e.target.value = ""; }}
                    className="text-xs"
                    disabled={uploading === i}
                  />
                  {uploading === i && <span className="text-xs text-muted-foreground">Mengunggah &amp; mengonversi...</span>}
                  {slide.image && (
                    <button type="button" onClick={() => updateSlide(i, "image", "")} className="text-left text-xs text-destructive hover:underline">
                      Hapus gambar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div><Label className="text-xs">Tombol Utama (teks)</Label><Input value={slide.ctaText || ""} onChange={(e) => updateSlide(i, "ctaText", e.target.value)} /></div>
              <div><Label className="text-xs">Tombol Utama (link)</Label><Input value={slide.ctaLink || ""} onChange={(e) => updateSlide(i, "ctaLink", e.target.value)} /></div>
              <div><Label className="text-xs">Tombol Kedua (teks)</Label><Input value={slide.ctaSecondaryText || ""} onChange={(e) => updateSlide(i, "ctaSecondaryText", e.target.value)} /></div>
              <div><Label className="text-xs">Tombol Kedua (link)</Label><Input value={slide.ctaSecondaryLink || ""} onChange={(e) => updateSlide(i, "ctaSecondaryLink", e.target.value)} /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div><Label className="text-xs">Stat Value</Label><Input value={slide.statValue || ""} onChange={(e) => updateSlide(i, "statValue", e.target.value)} placeholder="100" /></div>
              <div><Label className="text-xs">Stat Unit</Label><Input value={slide.statUnit || ""} onChange={(e) => updateSlide(i, "statUnit", e.target.value)} placeholder="Mbps" /></div>
              <div><Label className="text-xs">Stat Label</Label><Input value={slide.statLabel || ""} onChange={(e) => updateSlide(i, "statLabel", e.target.value)} placeholder="Kecepatan Maksimal" /></div>
            </div>
          </div>
        ))}
        {uploadErr && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{uploadErr}</div>}
        <Button onClick={() => onSave(slides)} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Simpan Semua Slide"}</Button>
      </CardContent>
    </Card>
  );
}

function FeaturesForm({ data, onSave, saving }: { data: any; onSave: (v: any) => void; saving: boolean }) {
  const [features, setFeatures] = useState<any[]>(data || []);
  useEffect(() => { if (data) setFeatures(data); }, [data]);

  function update(index: number, field: string, value: string) {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  }

  function add() {
    setFeatures([...features, { title: "", description: "", icon: "Zap" }]);
  }

  function remove(index: number) {
    setFeatures(features.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Keunggulan / Fitur</CardTitle>
        <Button size="sm" variant="outline" onClick={add}><Plus className="mr-1 h-3 w-3" /> Tambah</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.map((f, i) => (
          <div key={i} className="flex gap-3 items-start rounded-lg border p-3">
            <div className="flex-1 grid gap-2 md:grid-cols-3">
              <div><Label className="text-xs">Judul</Label><Input value={f.title || ""} onChange={(e) => update(i, "title", e.target.value)} /></div>
              <div className="md:col-span-2"><Label className="text-xs">Deskripsi</Label><Input value={f.description || ""} onChange={(e) => update(i, "description", e.target.value)} /></div>
            </div>
            <Button size="sm" variant="ghost" className="text-destructive mt-5" onClick={() => remove(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
        <Button onClick={() => onSave(features)} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Simpan"}</Button>
      </CardContent>
    </Card>
  );
}

function TestimonialsForm({ data, onSave, saving }: { data: any; onSave: (v: any) => void; saving: boolean }) {
  const [items, setItems] = useState<any[]>(data || []);
  useEffect(() => { if (data) setItems(data); }, [data]);

  function update(index: number, field: string, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function add() {
    setItems([...items, { name: "", role: "", text: "" }]);
  }

  function remove(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Testimoni Pelanggan</CardTitle>
        <Button size="sm" variant="outline" onClick={add}><Plus className="mr-1 h-3 w-3" /> Tambah</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((t, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Testimoni {i + 1}</span>
              <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => remove(i)}><Trash2 className="h-3 w-3" /></Button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div><Label className="text-xs">Nama</Label><Input value={t.name || ""} onChange={(e) => update(i, "name", e.target.value)} /></div>
              <div><Label className="text-xs">Role/Paket</Label><Input value={t.role || ""} onChange={(e) => update(i, "role", e.target.value)} /></div>
            </div>
            <div><Label className="text-xs">Isi Testimoni</Label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={t.text || ""} onChange={(e) => update(i, "text", e.target.value)} /></div>
          </div>
        ))}
        <Button onClick={() => onSave(items)} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Simpan"}</Button>
      </CardContent>
    </Card>
  );
}

function SocialLinksForm({ data, onSave, saving }: { data: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState(data || {});
  useEffect(() => { if (data) setForm(data); }, [data]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Link Media Sosial</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Facebook</Label><Input value={form.facebook || ""} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/..." /></div>
        <div><Label>Instagram</Label><Input value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/..." /></div>
        <div><Label>TikTok</Label><Input value={form.tiktok || ""} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} placeholder="https://tiktok.com/@..." /></div>
        <div><Label>YouTube</Label><Input value={form.youtube || ""} onChange={(e) => setForm({ ...form, youtube: e.target.value })} placeholder="https://youtube.com/..." /></div>
        <Button onClick={() => onSave(form)} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Simpan"}</Button>
      </CardContent>
    </Card>
  );
}
