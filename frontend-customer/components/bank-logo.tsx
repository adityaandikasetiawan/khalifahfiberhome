/**
 * Logo bank & e-wallet. Memakai file logo resmi (dari media kit merchant) yang
 * disimpan lokal di /public/payment_gateway. Jika channel tidak punya file logo,
 * fallback ke teks bergaya (warna brand) agar tetap tampil rapi.
 */

interface BankConfig {
  label: string;
  bg: string;
  fg: string;
  short: string;
  /** Nama file logo di /public/payment_gateway (opsional) */
  logo?: string;
}

export const BANK_CONFIG: Record<string, BankConfig> = {
  bca: { label: "BCA", short: "BCA", bg: "#0060AF", fg: "#ffffff", logo: "bca.png" },
  bni: { label: "BNI", short: "BNI", bg: "#F15A22", fg: "#ffffff", logo: "bni.webp" },
  bri: { label: "BRI", short: "BRI", bg: "#00529C", fg: "#ffffff", logo: "bri.png" },
  mandiri: { label: "Mandiri", short: "MANDIRI", bg: "#003D79", fg: "#FFD200", logo: "mandiri.webp" },
  cimb: { label: "CIMB Niaga", short: "CIMB", bg: "#7A1F2B", fg: "#ffffff", logo: "cimb.png" },
  permata: { label: "Permata", short: "PERMATA", bg: "#00A79D", fg: "#ffffff", logo: "permata.webp" },
};

export const EWALLET_CONFIG: Record<string, BankConfig> = {
  dana: { label: "DANA", short: "DANA", bg: "#118EEA", fg: "#ffffff", logo: "dana.webp" },
  shopeepay: { label: "ShopeePay", short: "SPay", bg: "#EE4D2D", fg: "#ffffff", logo: "shopeepay.webp" },
  linkaja: { label: "LinkAja", short: "LinkAja", bg: "#E62129", fg: "#ffffff", logo: "linkaja.webp" },
};

export const QRIS_LOGO = "qris.png";

export function BankLogo({ channel, className = "" }: { channel: string; className?: string }) {
  const cfg = BANK_CONFIG[channel] ?? EWALLET_CONFIG[channel];

  // Punya file logo resmi -> tampilkan gambar (object-contain agar proporsional).
  if (cfg?.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/payment_gateway/${cfg.logo}`}
        alt={cfg.label}
        loading="lazy"
        decoding="async"
        className={`object-contain ${className}`}
      />
    );
  }

  // Fallback teks bergaya (mis. BRI yang belum ada file logo).
  if (cfg) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded font-extrabold tracking-tight ${className}`}
        style={{ backgroundColor: cfg.bg, color: cfg.fg }}
      >
        {cfg.short}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center rounded font-bold text-xs ${className}`}>
      {channel.toUpperCase()}
    </span>
  );
}
