"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  WifiOff,
  BarChart3,
  LogOut,
  Wifi,
  Router,
  Activity,
  MessageSquare,
  Network,
  Megaphone,
  Settings,
  MessageCircle,
  UserPlus,
  Wallet,
  CreditCard,
  Radio,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type NavLink = { href: string; label: string; icon: any };
type NavGroup = { label: string; icon: any; children: NavLink[] };
type NavEntry = NavLink | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => (e as NavGroup).children !== undefined;

// Menu dikelompokkan berdasarkan domain. Route halaman TIDAK berubah.
const NAV: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Pelanggan",
    icon: Users,
    children: [
      { href: "/customers", label: "Daftar Pelanggan", icon: Users },
      { href: "/pendaftaran", label: "Pendaftaran Baru", icon: UserPlus },
      { href: "/subscriptions", label: "Langganan", icon: Wifi },
      { href: "/isolir", label: "Tugas Isolir", icon: WifiOff },
    ],
  },
  {
    label: "Billing",
    icon: Wallet,
    children: [
      { href: "/invoices", label: "Invoice", icon: FileText },
      { href: "/payments", label: "Pembayaran", icon: CreditCard },
      { href: "/packages", label: "Paket", icon: Package },
      { href: "/reports", label: "Laporan", icon: BarChart3 },
    ],
  },
  {
    label: "Jaringan",
    icon: Network,
    children: [
      { href: "/routers", label: "Router MikroTik", icon: Router },
      { href: "/monitoring", label: "Monitoring", icon: Activity },
      { href: "/odp", label: "ODP", icon: Network },
    ],
  },
  {
    label: "Komunikasi",
    icon: Radio,
    children: [
      { href: "/broadcast", label: "Broadcast", icon: Megaphone },
      { href: "/whatsapp", label: "WhatsApp Gateway", icon: MessageCircle },
    ],
  },
  { href: "/tickets", label: "Tiket Gangguan", icon: MessageSquare },
  { href: "/site-settings", label: "Pengaturan Situs", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();

  // Grup terbuka default jika salah satu child-nya aktif.
  const initialOpen: Record<string, boolean> = {};
  for (const e of NAV) {
    if (isGroup(e)) initialOpen[e.label] = e.children.some((c) => isActivePath(pathname, c.href));
  }
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  }

  const linkClass = (active: boolean, nested = false) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      nested && "pl-9 text-[13px]",
      active
        ? "bg-sidebar-accent text-sidebar-primary"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    );

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Khalifah Fiber Home" className="h-9 w-auto object-contain" />
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((entry) => {
          if (!isGroup(entry)) {
            const active = isActivePath(pathname, entry.href);
            return (
              <Link key={entry.href} href={entry.href} className={linkClass(active)}>
                <entry.icon className="h-4 w-4" />
                {entry.label}
              </Link>
            );
          }

          const groupActive = entry.children.some((c) => isActivePath(pathname, c.href));
          const isOpen = open[entry.label] ?? groupActive;
          return (
            <div key={entry.label}>
              <button
                onClick={() => setOpen((s) => ({ ...s, [entry.label]: !isOpen }))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  groupActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <entry.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className="mt-1 space-y-1">
                  {entry.children.map((c) => (
                    <Link key={c.href} href={c.href} className={linkClass(isActivePath(pathname, c.href), true)}>
                      <c.icon className="h-3.5 w-3.5" />
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <Separator />
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
