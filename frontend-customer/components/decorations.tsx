/**
 * Decorative components for visual enhancement
 */

export function WaveDivider({ flip = false, color = "hsl(var(--muted))" }: { flip?: boolean; color?: string }) {
  return (
    <div className={`w-full overflow-hidden leading-none ${flip ? "rotate-180" : ""}`}>
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 md:h-16" preserveAspectRatio="none">
        <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1360,50 1440,40 L1440,80 L0,80 Z" fill={color} />
      </svg>
    </div>
  );
}

export function DotPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute pointer-events-none opacity-[0.03] ${className}`} width="400" height="400">
      <defs>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute pointer-events-none opacity-[0.03] ${className}`} width="600" height="600">
      <defs>
        <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

export function FloatingShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Circles */}
      <div className="absolute top-[15%] left-[5%] w-3 h-3 rounded-full bg-primary/20 animate-float" />
      <div className="absolute top-[25%] right-[8%] w-4 h-4 rounded-full bg-secondary/20 animate-float-delayed" />
      <div className="absolute bottom-[20%] left-[12%] w-2 h-2 rounded-full bg-primary/30 animate-bounce-slow" />
      <div className="absolute top-[60%] right-[15%] w-3 h-3 rounded-full bg-secondary/15 animate-float" />

      {/* Squares */}
      <div className="absolute top-[40%] left-[3%] w-4 h-4 rounded-md bg-primary/10 rotate-12 animate-float-delayed" />
      <div className="absolute bottom-[30%] right-[5%] w-5 h-5 rounded-md bg-secondary/10 -rotate-12 animate-float" />

      {/* Crosses */}
      <div className="absolute top-[10%] right-[25%] text-primary/15 text-2xl animate-bounce-slow">+</div>
      <div className="absolute bottom-[15%] left-[20%] text-secondary/15 text-xl animate-float-delayed">+</div>

      {/* Triangles */}
      <svg className="absolute top-[50%] left-[8%] w-4 h-4 text-primary/10 animate-float" viewBox="0 0 20 20">
        <polygon points="10,2 18,18 2,18" fill="currentColor" />
      </svg>
      <svg className="absolute top-[20%] right-[12%] w-3 h-3 text-secondary/10 animate-float-delayed" viewBox="0 0 20 20">
        <polygon points="10,2 18,18 2,18" fill="currentColor" />
      </svg>
    </div>
  );
}

export function GlowOrb({ className = "", color = "primary" }: { className?: string; color?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}>
      <div className={`w-full h-full rounded-full bg-${color}/10`} />
    </div>
  );
}

export function NetworkLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="50" cy="50" r="1" fill="hsl(var(--primary))" />
          <line x1="50" y1="50" x2="100" y2="0" stroke="hsl(var(--primary))" strokeWidth="0.3" />
          <line x1="50" y1="50" x2="0" y2="100" stroke="hsl(var(--primary))" strokeWidth="0.3" />
          <line x1="50" y1="50" x2="100" y2="100" stroke="hsl(var(--primary))" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#network)" />
    </svg>
  );
}

export function SpeedLines() {
  return (
    <svg className="absolute right-0 top-0 h-full w-48 pointer-events-none opacity-10" viewBox="0 0 200 400" fill="none">
      <line x1="180" y1="0" x2="20" y2="400" stroke="hsl(var(--primary))" strokeWidth="1" />
      <line x1="160" y1="0" x2="0" y2="400" stroke="hsl(var(--primary))" strokeWidth="0.5" />
      <line x1="200" y1="0" x2="40" y2="400" stroke="hsl(var(--secondary))" strokeWidth="0.5" />
      <line x1="140" y1="0" x2="60" y2="300" stroke="hsl(var(--primary))" strokeWidth="0.3" />
      <line x1="190" y1="50" x2="30" y2="350" stroke="hsl(var(--secondary))" strokeWidth="0.3" />
    </svg>
  );
}

export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 py-8">
      {/* Fiber Optic badge */}
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 20 L18 20 L20 14 L22 26 L24 20 L28 20" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-medium">Fiber Optic</span>
      </div>
      {/* 24/7 Support */}
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" />
          <text x="20" y="24" textAnchor="middle" fill="hsl(var(--primary))" fontSize="10" fontWeight="bold">24/7</text>
        </svg>
        <span className="text-xs font-medium">Support</span>
      </div>
      {/* No FUP */}
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" />
          <text x="20" y="18" textAnchor="middle" fill="hsl(var(--primary))" fontSize="7" fontWeight="bold">NO</text>
          <text x="20" y="27" textAnchor="middle" fill="hsl(var(--primary))" fontSize="8" fontWeight="bold">FUP</text>
        </svg>
        <span className="text-xs font-medium">Unlimited</span>
      </div>
      {/* Uptime */}
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 10 L20 20 L26 24" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-medium">99.9% Uptime</span>
      </div>
    </div>
  );
}
