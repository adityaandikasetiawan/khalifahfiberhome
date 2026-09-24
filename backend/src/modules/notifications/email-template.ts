/**
 * Builder template email HTML yang rapi & menarik, dipakai bersama untuk
 * invoice, reminder, isolir, payment_success, dan verifikasi registrasi.
 *
 * Desain email-safe (inline CSS, table-based header) agar tampil konsisten di
 * Gmail/Outlook. Logo opsional via env EMAIL_LOGO_URL (harus URL publik https).
 */

export interface BrandInfo {
  name: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  email?: string;
  logoUrl?: string;
}

export interface EmailSection {
  greetingName?: string;
  /** Judul besar di badge atas konten (mis. "Tagihan Baru"). */
  heading: string;
  /** Warna aksen tema (hex), default biru. */
  accent?: string;
  /** Emoji/ikon besar untuk visual (mis. "🧾"). */
  emoji?: string;
  /** Paragraf pembuka. */
  intro: string;
  /** Baris detail key-value yang ditampilkan dalam kartu. */
  rows?: { label: string; value: string; strong?: boolean }[];
  /** Nominal besar yang disorot (mis. "Rp 150.000"). */
  amount?: string;
  amountLabel?: string;
  /** Tombol aksi utama. */
  buttonText?: string;
  buttonUrl?: string;
  /** Catatan tambahan di bawah tombol. */
  note?: string;
  /** Kotak sorotan opsional (mis. info atur password), tampil menonjol. */
  callout?: { title: string; html: string };
}

function esc(s: string): string {
  return String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
}

export function renderBrandedEmail(brand: BrandInfo, s: EmailSection): string {
  const accent = s.accent || "#2563eb";
  const accentDark = "#1e40af";
  const logo = brand.logoUrl
    ? `<span style="display:inline-block;background:#ffffff;border-radius:10px;padding:8px 14px"><img src="${brand.logoUrl}" alt="${esc(brand.name)}" height="34" style="height:34px;display:block;border:0" /></span>`
    : `<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:.3px">${esc(brand.name)}</div>`;

  const rowsHtml = (s.rows ?? [])
    .map(
      (r) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">${esc(r.label)}</td>
          <td style="padding:8px 0;text-align:right;font-size:14px;${r.strong ? "font-weight:700;color:#111827" : "color:#111827"}">${esc(r.value)}</td>
        </tr>`,
    )
    .join("");

  const amountBlock = s.amount
    ? `
      <table role="presentation" width="100%" style="margin:8px 0 4px">
        <tr><td style="padding-top:12px;border-top:1px solid #eef2f7">
          <div style="color:#6b7280;font-size:13px">${esc(s.amountLabel || "Total")}</div>
          <div style="font-size:26px;font-weight:800;color:${accent};margin-top:2px">${esc(s.amount)}</div>
        </td></tr>
      </table>`
    : "";

  const button =
    s.buttonText && s.buttonUrl
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0">
        <tr><td style="border-radius:8px;background:${accent}">
          <a href="${s.buttonUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">${esc(s.buttonText)}</a>
        </td></tr>
      </table>`
      : "";

  const card =
    s.rows && s.rows.length
      ? `
      <table role="presentation" width="100%" style="background:#f9fafb;border:1px solid #eef2f7;border-radius:12px;padding:4px 16px;margin:18px 0">
        ${rowsHtml}
        ${amountBlock}
      </table>`
      : amountBlock;

  const contactBits = [
    brand.whatsapp ? `WhatsApp: ${esc(brand.whatsapp)}` : "",
    brand.phone ? `Telp: ${esc(brand.phone)}` : "",
    brand.email ? esc(brand.email) : "",
  ]
    .filter(Boolean)
    .join(" &middot; ");

  return `<!doctype html>
<html lang="id">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);font-family:'Segoe UI',Arial,Helvetica,sans-serif">
        <!-- Header brand -->
        <tr><td style="background:linear-gradient(135deg,${accent},${accentDark});padding:24px 28px">
          ${logo}
          ${brand.tagline ? `<div style="color:#dbeafe;font-size:12px;margin-top:4px">${esc(brand.tagline)}</div>` : ""}
        </td></tr>

        <!-- Banner ikon + heading -->
        <tr><td style="padding:28px 28px 0">
          <div style="text-align:center">
            <div style="font-size:44px;line-height:1">${s.emoji || "📢"}</div>
            <div style="display:inline-block;margin-top:8px;background:${accent}1a;color:${accent};font-size:13px;font-weight:700;padding:6px 14px;border-radius:999px">${esc(s.heading)}</div>
          </div>
        </td></tr>

        <!-- Konten -->
        <tr><td style="padding:20px 28px 8px;color:#111827">
          ${s.greetingName ? `<p style="margin:0 0 6px;font-size:16px;font-weight:700">Halo ${esc(s.greetingName)},</p>` : ""}
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.6">${esc(s.intro)}</p>
          ${card}
          ${
            s.callout
              ? `<table role="presentation" width="100%" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin:16px 0"><tr><td style="padding:14px 16px">
                   <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:4px">${esc(s.callout.title)}</div>
                   <div style="font-size:13px;color:#92400e;line-height:1.6">${s.callout.html}</div>
                 </td></tr></table>`
              : ""
          }
          ${button}
          ${s.note ? `<p style="margin:8px 0 0;color:#6b7280;font-size:13px;line-height:1.6">${esc(s.note)}</p>` : ""}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:22px 28px;background:#f9fafb;border-top:1px solid #eef2f7">
          <div style="font-size:13px;font-weight:700;color:#111827">${esc(brand.name)}</div>
          ${brand.address ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;line-height:1.5">${esc(brand.address)}</div>` : ""}
          ${contactBits ? `<div style="font-size:12px;color:#6b7280;margin-top:6px">${contactBits}</div>` : ""}
          <div style="font-size:11px;color:#9ca3af;margin-top:12px">Email ini dikirim otomatis. Mohon tidak membalas email ini.</div>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#94a3b8;margin-top:14px">&copy; ${new Date().getFullYear()} ${esc(brand.name)}</div>
    </td></tr>
  </table>
</body></html>`;
}
