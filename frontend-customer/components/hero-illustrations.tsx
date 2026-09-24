/**
 * Ilustrasi hero SVG animatif untuk tiap slide banner.
 * Tema: ISP Fiber Optic (kecepatan, promo, unlimited).
 */

/* Slide 1: Router fiber optic + speed meter — tema kecepatan & stabilitas */
export function SpeedHeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto" style={{ perspective: "1000px" }}>
      <div className="animate-float">
        <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
          <defs>
            <linearGradient id="sh-router" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B6B4A" />
              <stop offset="100%" stopColor="#0D4A33" />
            </linearGradient>
            <linearGradient id="sh-screen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8F5E9" />
              <stop offset="100%" stopColor="#C8E6C9" />
            </linearGradient>
            <linearGradient id="sh-arc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#1B6B4A" />
            </linearGradient>
            <radialGradient id="sh-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1B6B4A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1B6B4A" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="200" cy="330" rx="150" ry="22" fill="url(#sh-glow)" />

          <g transform="translate(100, 20)">
            <path d="M 10 110 A 90 90 0 0 1 190 110" stroke="#e5e7eb" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path d="M 10 110 A 90 90 0 0 1 190 110" stroke="url(#sh-arc)" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray="283" strokeDashoffset="20">
              <animate attributeName="stroke-dashoffset" values="283;20;40;20" dur="3s" repeatCount="indefinite" />
            </path>
            <line x1="100" y1="110" x2="165" y2="70" stroke="#1B6B4A" strokeWidth="4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-25 100 110;5 100 110;-10 100 110;-25 100 110" dur="3s" repeatCount="indefinite" />
            </line>
            <circle cx="100" cy="110" r="8" fill="#1B6B4A" />
            <text x="100" y="95" textAnchor="middle" fontSize="26" fontWeight="bold" fill="#1B6B4A">100</text>
            <text x="100" y="112" textAnchor="middle" fontSize="11" fill="#666">Mbps</text>
          </g>

          <rect x="110" y="180" width="180" height="110" rx="16" fill="url(#sh-router)" />
          <rect x="122" y="192" width="156" height="66" rx="8" fill="url(#sh-screen)" />
          <text x="200" y="225" textAnchor="middle" fill="#1B6B4A" fontSize="20" fontWeight="bold">FIBER</text>
          <text x="200" y="245" textAnchor="middle" fill="#4CAF50" fontSize="11">● Connected</text>

          <rect x="150" y="150" width="4" height="34" rx="2" fill="#1B6B4A" />
          <circle cx="152" cy="146" r="6" fill="#F5A623" />
          <rect x="246" y="150" width="4" height="34" rx="2" fill="#1B6B4A" />
          <circle cx="248" cy="146" r="6" fill="#F5A623" />

          <circle cx="140" cy="275" r="4" fill="#4CAF50" />
          <circle cx="158" cy="275" r="4" fill="#4CAF50" />
          <circle cx="176" cy="275" r="4" fill="#F5A623" />

          <path d="M290 165 Q308 156 318 165" stroke="#1B6B4A" strokeWidth="2.5" fill="none" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M296 152 Q320 138 334 152" stroke="#1B6B4A" strokeWidth="2.5" fill="none" opacity="0.4">
            <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2s" begin="0.3s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>

      <div className="absolute top-6 -right-2 rounded-2xl glass px-4 py-2.5 animate-bounce-slow">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">⚡</span>
          <span className="text-xs font-semibold">Low Latency</span>
        </div>
      </div>
      <div className="absolute bottom-16 -left-2 rounded-2xl glass px-4 py-2.5 animate-bounce-slow" style={{ animationDelay: "0.6s" }}>
        <div className="flex items-center gap-2">
          <span className="text-primary text-sm">🛡</span>
          <span className="text-xs font-semibold">99.9% Uptime</span>
        </div>
      </div>
    </div>
  );
}

/* Slide 2: Rumah + tag GRATIS — tema promo gratis instalasi */
export function PromoHeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="animate-float">
        <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
          <defs>
            <linearGradient id="ph-house" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B6B4A" />
              <stop offset="100%" stopColor="#0D4A33" />
            </linearGradient>
            <linearGradient id="ph-roof" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#e8940f" />
            </linearGradient>
            <radialGradient id="ph-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5A623" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="200" cy="330" rx="150" ry="22" fill="url(#ph-glow)" />

          <rect x="120" y="180" width="160" height="120" rx="8" fill="url(#ph-house)" />
          <polygon points="110,182 200,120 290,182" fill="url(#ph-roof)" />
          <rect x="185" y="240" width="30" height="60" rx="4" fill="#E8F5E9" />
          <circle cx="208" cy="270" r="2.5" fill="#1B6B4A" />
          <rect x="140" y="210" width="30" height="30" rx="4" fill="#E8F5E9" />
          <rect x="230" y="210" width="30" height="30" rx="4" fill="#E8F5E9" />
          <circle cx="200" cy="150" r="4" fill="#fff" />
          <path d="M188 148 Q200 138 212 148" stroke="#fff" strokeWidth="2.5" fill="none">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M182 142 Q200 128 218 142" stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" begin="0.3s" repeatCount="indefinite" />
          </path>

          <path d="M40 260 Q90 260 120 250" stroke="#F5A623" strokeWidth="4" fill="none" strokeDasharray="6 4">
            <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
          </path>
          <circle cx="36" cy="260" r="8" fill="#1B6B4A" opacity="0.4" />

          <g transform="translate(255, 95) rotate(12)">
            <circle cx="0" cy="0" r="46" fill="#ef4444" />
            <circle cx="0" cy="0" r="46" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" />
            <text x="0" y="-6" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">GRATIS</text>
            <text x="0" y="14" textAnchor="middle" fill="#fff" fontSize="11">Instalasi</text>
          </g>
        </svg>
      </div>

      <div className="absolute bottom-16 -left-2 rounded-2xl glass px-4 py-2.5 animate-bounce-slow">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">🎁</span>
          <span className="text-xs font-semibold">Free Router WiFi</span>
        </div>
      </div>
      <div className="absolute top-10 -right-2 rounded-2xl glass px-4 py-2.5 animate-bounce-slow" style={{ animationDelay: "0.6s" }}>
        <div className="flex items-center gap-2">
          <span className="text-primary text-sm">⏱</span>
          <span className="text-xs font-semibold">Pasang 1-3 Hari</span>
        </div>
      </div>
    </div>
  );
}

/* Slide 3: Layar streaming + infinity — tema unlimited tanpa FUP */
export function UnlimitedHeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="animate-float">
        <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
          <defs>
            <linearGradient id="uh-screen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B6B4A" />
              <stop offset="100%" stopColor="#0D4A33" />
            </linearGradient>
            <linearGradient id="uh-inf" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1B6B4A" />
              <stop offset="100%" stopColor="#F5A623" />
            </linearGradient>
            <radialGradient id="uh-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1B6B4A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1B6B4A" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="200" cy="335" rx="150" ry="20" fill="url(#uh-glow)" />

          <rect x="90" y="90" width="220" height="140" rx="12" fill="url(#uh-screen)" />
          <rect x="102" y="102" width="196" height="116" rx="6" fill="#0a2e20" />
          <circle cx="200" cy="160" r="30" fill="#fff" opacity="0.95" />
          <polygon points="192,146 192,174 216,160" fill="#1B6B4A" />
          <rect x="185" y="230" width="30" height="26" fill="#0D4A33" />
          <rect x="150" y="256" width="100" height="10" rx="5" fill="#0D4A33" />

          <g>
            <rect x="60" y="70" width="52" height="26" rx="13" fill="#fff" stroke="#e5e7eb">
              <animate attributeName="y" values="70;62;70" dur="3s" repeatCount="indefinite" />
            </rect>
            <text x="86" y="87" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1B6B4A">4K</text>
          </g>
          <g>
            <rect x="290" y="80" width="60" height="26" rx="13" fill="#fff" stroke="#e5e7eb">
              <animate attributeName="y" values="80;72;80" dur="3s" begin="0.5s" repeatCount="indefinite" />
            </rect>
            <text x="320" y="97" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#F5A623">Gaming</text>
          </g>

          <g transform="translate(200, 290)">
            <path d="M -40 0 C -40 -18, -14 -18, 0 0 C 14 18, 40 18, 40 0 C 40 -18, 14 -18, 0 0 C -14 18, -40 18, -40 0 Z" fill="none" stroke="url(#uh-inf)" strokeWidth="8" strokeLinecap="round" />
          </g>
          <text x="200" y="322" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1B6B4A">UNLIMITED</text>
        </svg>
      </div>

      <div className="absolute top-6 -left-2 rounded-2xl glass px-4 py-2.5 animate-bounce-slow">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">📺</span>
          <span className="text-xs font-semibold">Streaming 4K</span>
        </div>
      </div>
      <div className="absolute bottom-20 -right-2 rounded-2xl glass px-4 py-2.5 animate-bounce-slow" style={{ animationDelay: "0.6s" }}>
        <div className="flex items-center gap-2">
          <span className="text-primary text-sm">🎮</span>
          <span className="text-xs font-semibold">Tanpa Lag</span>
        </div>
      </div>
    </div>
  );
}

export const HERO_ILLUSTRATIONS = [SpeedHeroIllustration, PromoHeroIllustration, UnlimitedHeroIllustration];
