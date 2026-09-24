"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Wifi, MapPin, Phone, Calendar, Hash } from "lucide-react";
import { api } from "@/lib/api";

interface Profile {
  id: string;
  name: string;
  customerNumber: string;
  phone: string;
  address?: string;
  status?: string;
  installDate?: string;
  package?: {
    name: string;
    desc?: string;
  };
  packageName?: string;
  packageDesc?: string;
}

export default function PortalProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("portalAccessToken");
    if (!token) {
      router.push("/portal/login");
      return;
    }

    api
      .get("/portal/me")
      .then((res) => {
        setProfile(res.data.data ?? res.data);
      })
      .catch(() => {
        router.push("/portal/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  const packageName = profile.package?.name ?? profile.packageName ?? "-";
  const packageDesc = profile.package?.desc ?? profile.packageDesc ?? "Cocok untuk beberapa perangkat";

  const infoItems = [
    { icon: User, label: "Nama", value: profile.name },
    { icon: Hash, label: "Nomor Pelanggan", value: profile.customerNumber },
    { icon: Phone, label: "No. HP", value: profile.phone },
    { icon: MapPin, label: "Alamat", value: profile.address ?? "-" },
    { icon: Wifi, label: "Paket", value: `${packageName} — ${packageDesc}` },
    {
      icon: Calendar,
      label: "Tanggal Pasang",
      value: profile.installDate
        ? new Date(profile.installDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>

        <h1 className="text-2xl font-bold">Profil Pelanggan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi akun dan layanan Anda
        </p>

        <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.customerNumber}</p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                profile.status === "active"
                  ? "bg-green-100 text-green-700"
                  : profile.status === "suspended"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {profile.status === "active"
                ? "Aktif"
                : profile.status === "suspended"
                  ? "Terisolir"
                  : profile.status ?? "Aktif"}
            </span>
          </div>

          {/* Info Grid */}
          <div className="space-y-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border p-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Untuk perubahan data, silakan hubungi tim support kami via{" "}
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}
