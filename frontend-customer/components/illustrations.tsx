/**
 * SVG illustrations dengan efek 3D (gradient, shadow, perspective)
 * untuk website Khalifah Fiber Home.
 */

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto" style={{ perspective: "1000px" }}>
      {/* Floating router 3D */}
      <div className="animate-float relative" style={{ transform: "rotateY(-5deg) rotateX(5deg)" }}>
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
          {/* Background glow */}
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1B6B4A" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1B6B4A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="routerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B6B4A" />
              <stop offset="100%" stopColor="#0D4A33" />
            </linearGradient>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8F5E9" />
              <stop offset="100%" stopColor="#C8E6C9" />
            </linearGradient>
            <filter id="shadow3d">
              <feDropShadow dx="0" dy="20" stdDeviation="15" floodColor="#1B6B4A" floodOpacity="0.15" />
            </filter>
          </defs>
          
          <ellipse cx="200" cy="270" rx="150" ry="20" fill="url(#glow)" />
          
          {/* Router body */}
          <rect x="100" y="100" width="200" height="120" rx="16" fill="url(#routerGrad)" filter="url(#shadow3d)" />
          <rect x="110" y="108" width="180" height="80" rx="8" fill="url(#screenGrad)" opacity="0.9" />
          
          {/* Screen content - speed indicator */}
          <text x="200" y="145" textAnchor="middle" fill="#1B6B4A" fontSize="24" fontWeight="bold">100 Mbps</text>
          <text x="200" y="168" textAnchor="middle" fill="#4CAF50" fontSize="12">● Connected</text>
          
          {/* Antenna */}
          <rect x="155" y="65" width="4" height="40" rx="2" fill="#1B6B4A" />
          <circle cx="157" cy="60" r="6" fill="#F5A623" />
          <rect x="240" y="65" width="4" height="40" rx="2" fill="#1B6B4A" />
          <circle cx="242" cy="60" r="6" fill="#F5A623" />
          
          {/* LED indicators */}
          <circle cx="140" cy="205" r="4" fill="#4CAF50" />
          <circle cx="160" cy="205" r="4" fill="#4CAF50" />
          <circle cx="180" cy="205" r="4" fill="#F5A623" />
          <circle cx="200" cy="205" r="4" fill="#4CAF50" />
          
          {/* Signal waves */}
          <path d="M300 80 Q320 70 330 80" stroke="#1B6B4A" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M305 65 Q330 50 345 65" stroke="#1B6B4A" strokeWidth="2" fill="none" opacity="0.4" />
          <path d="M310 50 Q340 30 360 50" stroke="#1B6B4A" strokeWidth="2" fill="none" opacity="0.2" />
          
          {/* Fiber cable */}
          <path d="M60 160 Q80 160 100 155" stroke="#F5A623" strokeWidth="3" fill="none" strokeDasharray="5 3" />
          <circle cx="55" cy="160" r="8" fill="#F5A623" opacity="0.3" />
          <circle cx="55" cy="160" r="4" fill="#F5A623" />
        </svg>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-4 right-4 animate-bounce-slow">
        <div className="rounded-xl bg-white shadow-lg px-3 py-2 text-xs font-semibold text-primary border">
          ↑ 100 Mbps
        </div>
      </div>
      <div className="absolute bottom-16 left-0 animate-bounce-slow" style={{ animationDelay: "1s" }}>
        <div className="rounded-xl bg-white shadow-lg px-3 py-2 text-xs font-semibold text-green-600 border">
          ● Uptime 99.9%
        </div>
      </div>
    </div>
  );
}

export function FiberIllustration() {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto">
      <defs>
        <linearGradient id="fiber1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1B6B4A" stopOpacity="0" />
          <stop offset="50%" stopColor="#1B6B4A" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
        <linearGradient id="fiber2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F5A623" stopOpacity="0" />
          <stop offset="50%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#1B6B4A" />
        </linearGradient>
      </defs>
      
      {/* Fiber lines with glow */}
      <path d="M0 100 Q100 60 200 100 Q300 140 400 100" stroke="url(#fiber1)" strokeWidth="3" fill="none">
        <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M0 100 Q100 60 200 100 Q300 140 400 100" stroke="url(#fiber1)" strokeWidth="3" fill="none" strokeDasharray="10 5" opacity="0.5" />
      
      <path d="M0 120 Q100 80 200 120 Q300 160 400 120" stroke="url(#fiber2)" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M0 80 Q100 120 200 80 Q300 40 400 80" stroke="#1B6B4A" strokeWidth="2" fill="none" opacity="0.4" />
      
      {/* Data dots flowing */}
      <circle r="4" fill="#1B6B4A">
        <animateMotion dur="3s" repeatCount="indefinite" path="M0,100 Q100,60 200,100 Q300,140 400,100" />
      </circle>
      <circle r="3" fill="#F5A623">
        <animateMotion dur="4s" repeatCount="indefinite" path="M0,120 Q100,80 200,120 Q300,160 400,120" />
      </circle>
      <circle r="3" fill="#4CAF50">
        <animateMotion dur="3.5s" repeatCount="indefinite" path="M0,80 Q100,120 200,80 Q300,40 400,80" />
      </circle>
      
      {/* House icon at end */}
      <path d="M370 85 L385 75 L400 85 L400 105 L370 105 Z" fill="#1B6B4A" opacity="0.8" />
      <rect x="380" y="92" width="8" height="13" fill="#E8F5E9" />
      
      {/* Tower at start */}
      <rect x="5" y="70" width="6" height="40" fill="#1B6B4A" opacity="0.8" />
      <polygon points="8,55 0,70 16,70" fill="#1B6B4A" opacity="0.6" />
    </svg>
  );
}

export function SpeedMeter({ speed = 100 }: { speed?: number }) {
  const angle = (speed / 100) * 180 - 90;
  return (
    <div className="relative inline-flex" style={{ perspective: "600px" }}>
      <div style={{ transform: "rotateX(10deg)" }}>
        <svg viewBox="0 0 200 120" className="w-48 h-28 drop-shadow-xl">
          <defs>
            <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#1B6B4A" />
            </linearGradient>
          </defs>
          {/* Meter arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="#e5e7eb" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="url(#meterGrad)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (speed / 100) * 251} />
          {/* Needle */}
          <line x1="100" y1="100" x2={100 + 60 * Math.cos((angle * Math.PI) / 180)} y2={100 + 60 * Math.sin((angle * Math.PI) / 180)} stroke="#1B6B4A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill="#1B6B4A" />
          <text x="100" y="90" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#1B6B4A">{speed}</text>
          <text x="100" y="108" textAnchor="middle" fontSize="8" fill="#666">Mbps</text>
        </svg>
      </div>
    </div>
  );
}
