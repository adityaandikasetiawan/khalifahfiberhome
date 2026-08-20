"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/packages", label: "Paket", icon: Package },
  { href: "/subscriptions", label: "Subscription", icon: Wifi },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/routers", label: "Router MikroTik", icon: Router },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/isolir", label: "Tugas Isolir", icon: WifiOff },
  { href: "/tickets", label: "Tiket Gangguan", icon: MessageSquare },
  { href: "/odp", label: "ODP", icon: Network },
  { href: "/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 px-6">
        <Wifi className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">ISP Billing</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
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
