"use client";

import Link from "next/link";
import { Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-3">
        <Wifi className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">ISP Billing & Payment System</h1>
      </div>
      <p className="text-muted-foreground">Sistem penagihan dan pembayaran pelanggan internet</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Masuk ke Dashboard Admin</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/portal/login">Portal Pelanggan</Link>
        </Button>
      </div>
    </main>
  );
}
