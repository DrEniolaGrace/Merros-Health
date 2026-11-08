/** Meros mark: two interlaced strands meeting at a single point of gold light. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lm-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--rose-light)" />
          <stop offset="1" stopColor="var(--burgundy-glow)" />
        </linearGradient>
      </defs>
      <path d="M8 4 C 24 12, 8 20, 24 28" fill="none" stroke="url(#lm-a)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 4 C 8 12, 24 20, 8 28" fill="none" stroke="url(#lm-a)" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="16" cy="16" r="2.4" fill="var(--pearl-gold)" />
    </svg>
  );
}

export function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-lg font-medium tracking-tight text-ink">{name}</span>
    </span>
  );
}
