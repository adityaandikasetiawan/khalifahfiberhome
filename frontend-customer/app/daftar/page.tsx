"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserPlus, CheckCircle, MapPin, User, Phone, Mail, Home, Wifi } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { api } from "@/lib/api";
import { PasswordInput } from "@/components/password-input";

interface Pkg {
  id: string;
  name: string;
  displayDesc?: string;
  price: number;
  billingCycle: string;
  isActive?: boolean;
}

const FALLBACK_PACKAGES: Pkg[] = [
  { id: "1", name: "Home Basic", displayDesc: "Cocok untuk 1-2 perangkat", price: 150000, billingCycle: "monthly" },
  { id: "2", name: "Home Plus", displayDesc: "Cocok untuk beberapa perangkat", price: 250000, billingCycle: "monthly" },
  { id: "3", name: "Home Pro", displayDesc: "Cocok untuk banyak perangkat", price: 300000, billingCycle: "monthly" },
  { id: "4", name: "Home Max", displayDesc: "Cocok untuk keluarga & WFH", price: 400000, billingCycle: "monthly" },
];

function DaftarForm() {
  const searchParams = useSearchParams();
  const paketParam = searchParams.get("paket") || "";

  const [packages, setPackages] = useState<Pkg[]>(FALLBACK_PACKAGES);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    nik: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
    address: "",
    kelurahan: "",
    kecamatan: "",
    paket: paketParam, // menyimpan packageId
    notes: "",
  });

  useEffect(() => {
    // Endpoint publik khusus registrasi (tidak butuh login)
    api.get("/registrations/packages").then((res) => {
      if (res.data.data?.length > 0) {
        setPackages(res.data.data.filter((p: Pkg) => p.isActive !== false));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // paketParam dari /paket berupa string "Nama XxMbps". Cocokkan ke package id.
    if (paketParam && packages.length > 0) {
      const match = packages.find(
        (p) =>
          p.name.toLowerCase() === paketParam.toLowerCase() ||
          p.id === paketParam,
      );
      if (match) setForm((prev) => ({ ...prev, paket: match.id }));
    }
  }, [paketParam, packages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!form.email) {
      setErrorMsg("Email wajib diisi untuk verifikasi pendaftaran.");
      return;
    }
    if (!form.paket) {
      setErrorMsg("Silakan pilih paket internet.");
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/registrations", {
        fullName: form.name,
        nik: form.nik || undefined,
        phone: form.phone,
        email: form.email,
        password: form.password,
        address: form.address,
        kelurahan: form.kelurahan || undefined,
        kecamatan: form.kecamatan || undefined,
        packageId: form.paket, // form.paket kini berisi packageId
        notes: form.notes || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Gagal mengirim pendaftaran. Periksa data Anda atau coba lagi nanti.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <section className="py-20 lg:py-32">
          <div className="container mx-auto max-w-lg px-4">
            <div className="rounded-2xl border bg-card p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Pendaftaran Berhasil!</h2>
              <p className="text-muted-foreground mb-2">
                Terima kasih telah mendaftar di Khalifah Fiber Home.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                Kami telah mengirim <span className="font-medium text-foreground">email verifikasi</span> ke{" "}
                <span className="font-medium text-foreground">{form.email}</span>. Silakan buka email tersebut
                dan klik tautan verifikasi. Setelah terverifikasi, Anda bisa langsung login ke portal
                menggunakan email &amp; password yang Anda buat. Jika tidak ada di kotak masuk, periksa folder
                Spam/Promosi.
              </p>
              <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground text-left">
                <p className="font-medium text-foreground mb-1">Detail Pendaftaran:</p>
                <p>Nama: {form.name}</p>
                <p>No. HP: {form.phone}</p>
                <p>Email: {form.email}</p>
                <p>Alamat: {form.address}</p>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-primary/5 to-accent/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <UserPlus className="h-4 w-4 text-primary" />
            Registrasi Pelanggan Baru
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Daftar Berlangganan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Isi form di bawah ini untuk mendaftar sebagai pelanggan baru Khalifah Fiber Home. Tim kami akan segera menghubungi Anda.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-2xl px-4">
          <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Data Pribadi
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nama sesuai KTP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">No. KTP (NIK) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={form.nik}
                  onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="16 digit NIK"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">No. WhatsApp / HP <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="email@contoh.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">Dipakai untuk verifikasi & tagihan.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Password <span className="text-red-500">*</span></label>
                <PasswordInput
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(v) => setForm({ ...form, password: v })}
                  placeholder="Minimal 6 karakter"
                />
                <p className="mt-1 text-xs text-muted-foreground">Untuk login ke portal pelanggan.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Konfirmasi Password <span className="text-red-500">*</span></label>
                <PasswordInput
                  required
                  minLength={6}
                  value={form.passwordConfirm}
                  onChange={(v) => setForm({ ...form, passwordConfirm: v })}
                  placeholder="Ulangi password"
                />
              </div>
            </div>

            <hr className="border-border" />

            <h3 className="text-lg font-bold flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Alamat Pemasangan
            </h3>

            <div>
              <label className="block text-sm font-medium mb-1.5">Alamat Lengkap <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Jl. ..., RT/RW, No. Rumah"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Kelurahan/Desa <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.kelurahan}
                  onChange={(e) => setForm({ ...form, kelurahan: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Kelurahan/Desa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kecamatan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.kecamatan}
                  onChange={(e) => setForm({ ...form, kecamatan: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Kecamatan"
                />
              </div>
            </div>

            <hr className="border-border" />

            <h3 className="text-lg font-bold flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              Pilihan Paket
            </h3>

            <div>
              <label className="block text-sm font-medium mb-1.5">Paket Internet <span className="text-red-500">*</span></label>
              <select
                required
                value={form.paket}
                onChange={(e) => setForm({ ...form, paket: e.target.value })}
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">-- Pilih Paket --</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.displayDesc ?? "Cocok untuk beberapa perangkat"} (Rp {Number(pkg.price).toLocaleString("id-ID")}/bulan)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Catatan Tambahan (opsional)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Pertanyaan atau catatan khusus..."
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mengirim..." : "Daftar Berlangganan"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Dengan mendaftar, Anda menyetujui{" "}
              <a href="/syarat-ketentuan" className="text-primary hover:underline">Syarat & Ketentuan</a>{" "}
              dan{" "}
              <a href="/kebijakan-privasi" className="text-primary hover:underline">Kebijakan Privasi</a>{" "}
              kami.
            </p>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default function DaftarPage() {
  return (
    <Suspense fallback={null}>
      <DaftarForm />
    </Suspense>
  );
}
