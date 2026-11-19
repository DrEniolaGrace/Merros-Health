/**
 * Small, static visuals for the home page feature cards, drawn from the app's own screens.
 * Plain SVG and HTML (no 3D, no data), so the home page stays light.
 */

/** Blind Couple Match: two orbs with a sealed link, and the one shared gene between them. */
export function MatchOrbs({ shared }: { shared: string }) {
  return (
    <div aria-hidden className="relative flex h-28 items-center justify-center gap-10" dir="ltr">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 112" preserveAspectRatio="none">
        <line x1="78" y1="56" x2="162" y2="56" stroke="var(--rose-light)" strokeOpacity="0.5" strokeDasharray="3 5" />
      </svg>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--rose-light),var(--burgundy-glow)_55%,var(--burgundy))] text-lg font-semibold text-white shadow-[0_0_30px_-6px_var(--burgundy-glow)]">M</span>
      <span className="relative rounded-full border border-[color-mix(in_oklab,var(--pearl-gold)_50%,transparent)] bg-[var(--bg-raised)] px-3 py-1 text-xs font-medium text-gold-ink">{shared}</span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--rose-light),var(--burgundy-glow)_55%,var(--burgundy))] text-lg font-semibold text-white shadow-[0_0_30px_-6px_var(--burgundy-glow)]">K</span>
    </div>
  );
}

/** Living Results: a classification moving from uncertain to likely benign, counsellor first. */
export function ReclassifiedPill({ from, to, note }: { from: string; to: string; note: string }) {
  return (
    <div aria-hidden className="flex h-28 flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2 text-xs" dir="ltr">
        <span className="rounded-full border border-glass-border px-3 py-1 text-muted line-through decoration-[var(--rose-light)]/60">{from}</span>
        <span className="text-gold-ink">→</span>
        <span className="rounded-full border border-[color-mix(in_oklab,var(--pearl-gold)_50%,transparent)] px-3 py-1 font-medium text-gold-ink">{to}</span>
      </div>
      <span className="text-xs text-muted">{note}</span>
    </div>
  );
}

/** The Genetic Copilot: a question and an answer in Arabic, right to left. */
export function ArabicChat({ question, answer }: { question: string; answer: string }) {
  return (
    <div aria-hidden className="flex h-28 flex-col justify-center gap-2" dir="rtl" lang="ar">
      <span className="self-start rounded-2xl rounded-ss-sm bg-[var(--burgundy)] px-3 py-1.5 text-xs text-white">{question}</span>
      <span className="self-end max-w-[85%] rounded-2xl rounded-se-sm border border-glass-border bg-glass px-3 py-1.5 text-xs leading-relaxed text-ink">{answer}</span>
    </div>
  );
}

/** Population Signals: a forecast line with its uncertainty band, and hidden small groups. */
export function SignalsSpark() {
  return (
    <svg aria-hidden viewBox="0 0 240 112" className="h-28 w-full">
      <path d="M150,38 L230,22 L230,64 L150,58 Z" fill="var(--pearl-gold)" fillOpacity="0.14" />
      <polyline points="10,86 30,80 50,84 70,70 90,74 110,58 130,62 150,48" fill="none" stroke="var(--data-cyan)" strokeWidth="2.5" strokeLinejoin="round" />
      <polyline points="150,48 230,42" fill="none" stroke="var(--pearl-gold)" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="10" y1="100" x2="230" y2="100" stroke="var(--glass-border)" />
      {[24, 64, 104, 144, 184].map((x, i) => (
        <rect key={x} x={x} y={104} width="28" height="5" rx="2" fill={i === 3 ? "url(#hatch)" : "var(--data-cyan)"} opacity={i === 3 ? 1 : 0.5} />
      ))}
      <defs>
        <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--text-secondary)" strokeWidth="1.5" />
        </pattern>
      </defs>
    </svg>
  );
}
