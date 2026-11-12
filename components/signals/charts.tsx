import { cn } from "@/lib/cn";

/** Charts for the Population Signals Dashboard. One hue for data (DESIGN.md: --data-cyan), text in ink tokens. */

export type Cell = number | null;

const nf = new Intl.NumberFormat("en-US");
export const fmt = (c: Cell, hidden: string) => (c === null ? hidden : nf.format(c));
export const pct = (r: number | null, hidden: string) => (r === null ? hidden : `${Math.round(r * 100)}%`);

/** Horizontal bars sharing one scale. A suppressed row shows a hatched placeholder and the hidden label. */
export function BarList({ rows, max, hidden, className }: { rows: { label: string; value: Cell; note?: string }[]; max: number; hidden: string; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1">
          <span className="truncate text-sm text-muted">{r.label}</span>
          <span className="text-sm text-ink tabular" dir="ltr">
            {fmt(r.value, hidden)}
            {r.note && <span className="ms-2 text-xs text-muted">{r.note}</span>}
          </span>
          <span className="col-span-2 block h-2 overflow-hidden rounded-full bg-glass-strong">
            {r.value === null ? (
              <span className="block h-full w-10 rounded-full bg-[repeating-linear-gradient(135deg,var(--glass-border)_0_3px,transparent_3px_6px)]" />
            ) : (
              <span
                className="block h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_oklab,var(--data-cyan)_55%,transparent),var(--data-cyan))]"
                style={{ width: `${Math.max(2, (r.value / Math.max(max, 1)) * 100)}%` }}
              />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A rate as a bar from 0 to 100%, with the value written out. */
export function RateRow({ label, rate, sub, hidden }: { label: string; rate: number | null; sub?: string; hidden: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1">
      <span className="text-sm text-ink">
        {label}
        {sub && <span className="ms-2 text-xs text-muted tabular" dir="ltr">{sub}</span>}
      </span>
      <span className="font-display text-lg text-ink tabular" dir="ltr">{pct(rate, hidden)}</span>
      <span className="col-span-2 block h-2 overflow-hidden rounded-full bg-glass-strong">
        {rate !== null && <span className="block h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_oklab,var(--data-cyan)_55%,transparent),var(--data-cyan))]" style={{ width: `${Math.max(2, rate * 100)}%` }} />}
      </span>
    </div>
  );
}

/** Before and after counselling, as two labelled bars on one 0 to 100% scale. */
export function BeforeAfter({ title, before, after, labels, hidden }: { title: string; before: number | null; after: number | null; labels: { before: string; after: string }; hidden: string }) {
  const row = (label: string, v: number | null, strong: boolean) => (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="block h-2.5 overflow-hidden rounded-full bg-glass-strong">
        {v !== null && (
          <span
            className={cn("block h-full rounded-full", strong ? "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--data-cyan)_55%,transparent),var(--data-cyan))]" : "bg-[color-mix(in_oklab,var(--data-cyan)_45%,transparent)]")}
            style={{ width: `${Math.max(2, v * 100)}%` }}
          />
        )}
      </span>
      <span className="text-end font-display text-lg text-ink tabular" dir="ltr">{pct(v, hidden)}</span>
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base text-ink">{title}</p>
      {row(labels.before, before, false)}
      {row(labels.after, after, true)}
    </div>
  );
}

export interface MapRegion {
  key: string;
  name: string;
  value: Cell;
  caption: string;
}

/**
 * Schematic map of the three regions of the emirate (not to scale): softly glowing nodes sized by
 * volume, with quiet flows between them. Positions are fixed west to east, in both languages.
 */
export function RegionMap({ regions, hidden, label }: { regions: MapRegion[]; hidden: string; label: string }) {
  const pos: Record<string, { x: number; y: number }> = { al_dhafra: { x: 110, y: 150 }, abu_dhabi: { x: 330, y: 92 }, al_ain: { x: 540, y: 140 } };
  const max = Math.max(...regions.map((r) => r.value ?? 0), 1);
  const radius = (v: Cell) => (v === null ? 14 : 16 + 30 * Math.sqrt(v / max));
  const hub = pos.abu_dhabi;
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox="0 0 650 250" role="img" aria-label={label} className="h-auto w-full" style={{ direction: "ltr" }}>
        <defs>
          <radialGradient id="sig-glow">
            <stop offset="0%" stopColor="var(--data-cyan)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="var(--data-cyan)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--data-cyan)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* coastline hint */}
        <path d="M20 96 C 120 60, 220 70, 300 52 S 470 40, 630 70" fill="none" stroke="var(--glass-border)" strokeWidth="1" strokeDasharray="2 6" />
        {regions
          .filter((r) => r.key !== "abu_dhabi")
          .map((r) => {
            const p = pos[r.key];
            const mx = (p.x + hub.x) / 2;
            const d = `M${p.x} ${p.y} Q ${mx} ${Math.min(p.y, hub.y) - 46} ${hub.x} ${hub.y}`;
            return <path key={r.key} d={d} fill="none" stroke="var(--data-cyan)" strokeOpacity="0.45" strokeWidth="1.25" strokeDasharray="3 9" className="signal-flow" />;
          })}
        {regions.map((r) => {
          const p = pos[r.key];
          const rad = radius(r.value);
          return (
            <g key={r.key}>
              <circle cx={p.x} cy={p.y} r={rad * 1.9} fill="url(#sig-glow)" className="signal-pulse" />
              <circle cx={p.x} cy={p.y} r={rad} fill="var(--bg-raised)" stroke="var(--data-cyan)" strokeWidth="1.5" strokeDasharray={r.value === null ? "3 4" : undefined} />
              <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--text-primary)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {r.value === null ? "–" : nf.format(r.value)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <ul className="grid gap-3 sm:grid-cols-3">
          {regions.map((r) => (
            <li key={r.key} className="flex flex-col gap-0.5 border-s border-glass-border ps-3">
              <span className="text-sm text-ink">{r.name}</span>
              <span className="text-xs text-muted">
                <span className="tabular text-ink" dir="ltr">{fmt(r.value, hidden)}</span> {r.caption}
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
