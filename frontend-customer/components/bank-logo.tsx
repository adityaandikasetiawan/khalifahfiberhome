/**
 * Logo bank & e-wallet sebagai teks bergaya di dalam kotak berwarna khas.
 * Dibuat inline (bukan file gambar) agar ringan, tajam di semua ukuran, dan
 * tidak bergantung aset eksternal / hak cipta logo asli.
 */

interface BankConfig {
  label: string;
  bg: string;
  fg: string;
  short: string;
}

export const BANK_CONFIG: Record<string, BankConfig> = {
  bca: { label: "BCA", short: "BCA", bg: "#0060AF", fg: "#ffffff" },
  bni: { label: "BNI", short: "BNI", bg: "#F15A22", fg: "#ffffff" },
  bri: { label: "BRI", short: "BRI", bg: "#00529C", fg: "#ffffff" },
  mandiri: { label: "Mandiri", short: "MANDIRI", bg: "#003D79", fg: "#FFD200" },
  cimb: { label: "CIMB Niaga", short: "CIMB", bg: "#7A1F2B", fg: "#ffffff" },
  permata: { label: "Permata", short: "PERMATA", bg: "#00A79D", fg: "#ffffff" },
};

export const EWALLET_CONFIG: Record<string, BankConfig> = {
  dana: { label: "DANA", short: "DANA", bg: "#118EEA", fg: "#ffffff" },
  shopeepay: { label: "ShopeePay", short: "SPay", bg: "#EE4D2D", fg: "#ffffff" },
  linkaja: { label: "LinkAja", short: "LinkAja", bg: "#E62129", fg: "#ffffff" },
};

export function BankLogo({ channel, className = "" }: { channel: string; className?: string }) {
  const cfg = BANK_CONFIG[channel] ?? EWALLET_CONFIG[channel];
  if (!cfg) {
    return (
      <span className={`inline-flex items-center justify-center rounded font-bold text-xs ${className}`}>
        {channel.toUpperCase()}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-extrabold tracking-tight ${className}`}
      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
    >
      {cfg.short}
    </span>
  );
}
