"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/paket", label: "Paket" },
  { href: "/cek-area", label: "Cek Area" },
  { href: "/cek-tagihan", label: "Cek Tagihan" },
  { href: "/faq", label: "FAQ" },
  { href: "/tentang", label: "Tentang" },
  { href: "/kontak", label: "Kontak" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide navbar on portal pages
  if (pathname.startsWith("/portal")) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-primary/5 border-b border-border/50"
          : "bg-white/95 backdrop-blur-sm border-b border-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Khalifah Fiber Home"
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                pathname === link.href
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/daftar"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 btn-shine"
          >
            Daftar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden relative p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <div className="relative w-5 h-5">
            <Menu className={cn("h-5 w-5 absolute transition-all duration-300", open ? "opacity-0 rotate-90" : "opacity-100 rotate-0")} />
            <X className={cn("h-5 w-5 absolute transition-all duration-300", open ? "opacity-100 rotate-0" : "opacity-0 -rotate-90")} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="border-t bg-white/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block py-2.5 px-3 text-sm font-medium rounded-lg transition-colors",
                pathname === link.href
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-primary hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 pb-1 grid grid-cols-2 gap-2">
            <Link
              href="/portal/login"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-primary/20 px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/daftar"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
