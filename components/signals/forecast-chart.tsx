"use client";

import { useId, useState } from "react";

export interface ForecastLabels {
  aria: string;
  history: string;
  forecast: string;
  hidden: string;
  now: string;
  sessions: string; // "{n} sessions"
  range: string; // "likely {low} to {high}"
  weekOf: string; // "Week of {date}"
}

const W = 680;
const H = 240;
const PAD = { l: 36, r: 16, t: 16, b: 28 };

/**
 * Weekly booked sessions (published, noised) and the 8 week forecast. Time always runs left to
 * right. Hidden weeks leave a gap in the line; the forecast is dashed gold with an 80% band.
 */
export function ForecastChart({ weeks, history, mean, low, high, labels, locale }: { weeks: string[]; history: (number | null)[]; mean: number[]; low: number[]; high: number[]; labels: ForecastLabels; locale: string }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const n = history.length + mean.length;
  const top = Math.max(...history.map((v) => v ?? 0), ...high, 10);
  const yMax = Math.ceil(top / 10) * 10;
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);

  // History as separate segments, so a hidden week is a visible gap rather than an invented value.
  const segments: number[][] = [];
  let run: number[] = [];
  history.forEach((v, i) => {
    if (v === null) {
      if (run.length) segments.push(run);
      run = [];
    } else run.push(i);
  });
  if (run.length) segments.push(run);
  const line = (idx: number[]) => idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)} ${y(history[i] as number).toFixed(1)}`).join(" ");
  const area = (idx: number[]) => `${line(idx)} L${x(idx[idx.length - 1]).toFixed(1)} ${y(0)} L${x(idx[0]).toFixed(1)} ${y(0)} Z`;

  const lastKnown = [...history.keys()].reverse().find((i) => history[i] !== null);
  const h0 = history.length;
  const fx = (k: number) => x(h0 + k);
  const start = lastKnown !== undefined ? `M${x(lastKnown).toFixed(1)} ${y(history[lastKnown] as number).toFixed(1)} ` : "";
  const meanPath = start + mean.map((m, k) => `${k || start ? "L" : "M"}${fx(k).toFixed(1)} ${y(m).toFixed(1)}`).join(" ");
  const band = high.map((v, k) => `${k ? "L" : "M"}${fx(k).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") + " " + [...low.keys()].reverse().map((k) => `L${fx(k).toFixed(1)} ${y(low[k]).toFixed(1)}`).join(" ") + " Z";

  const dateOf = (i: number) => {
    const base = new Date(weeks[0] + "T00:00:00Z").getTime();
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(base + i * 7 * 86_400_000));
  };
  const ticks = [0, yMax / 2, yMax];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  }

  const hv = hover === null ? null : hover < h0 ? history[hover] : mean[hover - h0];
  const tip =
    hover === null
      ? null
      : hover < h0
        ? history[hover] === null
          ? labels.hidden
          : labels.sessions.replace("{n}", String(history[hover]))
        : `${labels.sessions.replace("{n}", String(Math.round(mean[hover - h0])))} · ${labels.range.replace("{low}", String(Math.round(low[hover - h0]))).replace("{high}", String(Math.round(high[hover - h0])))}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.aria} className="h-auto w-full touch-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={`${id}-a`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--data-cyan)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--data-cyan)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--glass-border)" strokeWidth="1" />
              <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-secondary)" style={{ fontVariantNumeric: "tabular-nums" }}>{t}</text>
            </g>
          ))}
          <line x1={x(h0 - 0.5)} x2={x(h0 - 0.5)} y1={PAD.t} y2={y(0)} stroke="var(--glass-border)" strokeWidth="1" strokeDasharray="2 4" />
          <text x={x(h0 - 0.5)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{labels.now}</text>
          <text x={PAD.l} y={H - 8} textAnchor="start" fontSize="11" fill="var(--text-secondary)">{dateOf(0)}</text>
          <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="11" fill="var(--text-secondary)">{dateOf(n - 1)}</text>

          {segments.filter((s) => s.length > 1).map((s) => <path key={`a${s[0]}`} d={area(s)} fill={`url(#${id}-a)`} />)}
          {segments.map((s) =>
            s.length > 1 ? (
              <path key={`l${s[0]}`} d={line(s)} fill="none" stroke="var(--data-cyan)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            ) : (
              <circle key={`p${s[0]}`} cx={x(s[0])} cy={y(history[s[0]] as number)} r="2.5" fill="var(--data-cyan)" />
            ),
          )}
          <path d={band} fill="var(--pearl-gold)" fillOpacity="0.14" />
          <path d={meanPath} fill="none" stroke="var(--pearl-gold)" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
          <circle cx={fx(mean.length - 1)} cy={y(mean[mean.length - 1])} r="4" fill="var(--pearl-gold)" stroke="var(--bg-raised)" strokeWidth="2" />

          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="var(--text-secondary)" strokeWidth="1" strokeOpacity="0.6" />
              {hv !== null && <circle cx={x(hover)} cy={y(hv)} r="4.5" fill={hover < h0 ? "var(--data-cyan)" : "var(--pearl-gold)"} stroke="var(--bg-raised)" strokeWidth="2" />}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            role="status"
            className="glass pointer-events-none absolute top-2 z-10 max-w-56 rounded-control px-3 py-2 text-xs text-ink"
            style={{ left: `${Math.min(72, Math.max(2, (x(hover) / W) * 100 - 14))}%` }}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <p className="text-muted">{labels.weekOf.replace("{date}", dateOf(hover))}</p>
            <p className="tabular">{tip}</p>
          </div>
        )}
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
        <li className="flex items-center gap-2"><span aria-hidden className="h-0.5 w-6 rounded-full bg-cyan" />{labels.history}</li>
        <li className="flex items-center gap-2"><span aria-hidden className="h-0 w-6 border-t-2 border-dashed border-gold" />{labels.forecast}</li>
      </ul>
    </div>
  );
}
