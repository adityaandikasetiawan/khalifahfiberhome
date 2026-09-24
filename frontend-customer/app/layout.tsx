import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Khalifah Fiber Home - Internet Cepat & Stabil",
  description: "Layanan internet fiber optic cepat, stabil, dan terjangkau untuk rumah Anda. Khalifah Fiber Home.",
  keywords: "internet, fiber optic, ISP, wifi rumah, internet murah, khalifah fiber",
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
    apple: "/logo.png?v=2",
  },
  openGraph: {
    title: "Khalifah Fiber Home - Internet Cepat & Stabil",
    description: "Layanan internet fiber optic cepat, stabil, dan terjangkau untuk rumah Anda.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
