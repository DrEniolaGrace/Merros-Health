/**
 * "One changed copy, one working copy": two gene copies side by side. The working copy glows
 * rose; the changed copy carries a single gold mark. Text alternative supplied by the caller.
 */
export function CopyPair({ working, changed, label }: { working: string; changed: string; label: string }) {
  const rungs = Array.from({ length: 9 }, (_, i) => i);
  return (
    <figure className="flex flex-col items-center gap-3" aria-label={label} role="img">
      <svg viewBox="0 0 200 180" className="h-40 w-44" aria-hidden>
        <defs>
          <linearGradient id="cp-rose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--rose-light)" />
            <stop offset="1" stopColor="var(--burgundy-glow)" />
          </linearGradient>
          <filter id="cp-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[50, 150].map((x, k) => (
          <g key={x} filter="url(#cp-glow)">
            <rect x={x - 14} y="10" width="28" height="160" rx="14" fill="none" stroke="url(#cp-rose)" strokeOpacity={k === 0 ? 0.9 : 0.55} strokeWidth="1.5" />
            {rungs.map((r) => {
              const y = 22 + r * 17;
              const mark = k === 1 && r === 4;
              return (
                <rect
                  key={r}
                  x={x - 8}
                  y={y}
                  width="16"
                  height="6"
                  rx="3"
                  fill={mark ? "var(--pearl-gold)" : "url(#cp-rose)"}
                  opacity={mark ? 1 : k === 0 ? 0.85 : 0.4}
                />
              );
            })}
          </g>
        ))}
        <circle cx="150" cy="93" r="13" fill="none" stroke="var(--pearl-gold)" strokeOpacity="0.7" strokeDasharray="3 4" />
      </svg>
      {/* Order is fixed to match the drawing (working copy left, changed copy right) in both languages. */}
      <figcaption dir="ltr" className="grid w-44 grid-cols-2 gap-2 text-center text-xs">
        <span className="text-rose-ink">{working}</span>
        <span className="text-gold-ink">{changed}</span>
      </figcaption>
    </figure>
  );
}
