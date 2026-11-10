"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { combineAffected, perPregnancy } from "@/lib/risk/engine";
import { HALF, ZERO, toNumber, toPercentString } from "@/lib/risk/fraction";
import { DotMeter, Eyebrow, LiveBadge } from "@/components/ui/accents";
import { SafetyPill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/cn";

export interface ExplorerLabels {
  eyebrow: string;
  title: string;
  titleAccent: string;
  body: string;
  partner1: string;
  partner2: string;
  carrier: string;
  notCarrier: string;
  sharedGenes: string;
  sharedHint: string;
  resultEyebrow: string;
  exact: string;
  perPregnancy: string;
  affected: string;
  carrierChild: string;
  neither: string;
  perGene: string;
  genesTile: string;
  combinedTile: string;
  meterLabel: string;
  formulaOne: string;
  formulaMany: string;
  formulaNone: string;
  cta: string;
  disclaimer: string;
  education: string;
}

/**
 * Inheritance Explorer: an interactive teaching panel. Every number is computed by the tested
 * risk engine (perPregnancy, combineAffected) — the same code that computes real results.
 */
export function InheritanceExplorer({ labels, locale, ctaHref }: { labels: ExplorerLabels; locale: string; ctaHref: string }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(true);
  const [genes, setGenes] = useState(1);

  const result = useMemo(() => {
    const one = perPregnancy(a ? HALF : ZERO, b ? HALF : ZERO);
    const n = a && b ? genes : 1;
    const combined = combineAffected(Array.from({ length: n }, () => one.affected));
    return { one, combined, n };
  }, [a, b, genes]);

  const pct = toNumber(result.combined) * 100;
  const multi = result.n > 1;
  const formula = !(a && b) ? labels.formulaNone : multi ? labels.formulaMany.replace("{n}", String(result.n)) : labels.formulaOne;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      {/* Controls */}
      <div className="glass flex flex-col gap-8 rounded-hero p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <Eyebrow>{labels.eyebrow}</Eyebrow>
          <h2 className="text-3xl font-semibold leading-tight">
            <span className="text-gradient">{labels.title}</span> <span className="text-muted">{labels.titleAccent}</span>
          </h2>
          <p className="measure text-muted">{labels.body}</p>
        </div>
        <Segmented label={labels.partner1} value={a} onChange={setA} on={labels.carrier} off={labels.notCarrier} />
        <Segmented label={labels.partner2} value={b} onChange={setB} on={labels.carrier} off={labels.notCarrier} />
        <div className={cn("flex flex-col gap-3 transition-opacity duration-500", !(a && b) && "opacity-45")}>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="genes" className="text-base text-ink">{labels.sharedGenes}</label>
            <span className="glass rounded-control px-3 py-1 text-sm text-ink tabular">{a && b ? genes : 0}</span>
          </div>
          <input
            id="genes"
            type="range"
            min={1}
            max={3}
            step={1}
            value={genes}
            disabled={!(a && b)}
            onChange={(e) => setGenes(Number(e.target.value))}
            className="range"
            style={{ "--fill": `${a && b ? ((genes - 1) / 2) * 100 : 0}%` } as React.CSSProperties}
            aria-valuetext={String(genes)}
          />
          <div className="flex justify-between text-xs text-muted tabular" dir="ltr"><span>1</span><span>2</span><span>3</span></div>
          <p className="text-xs text-muted">{labels.sharedHint}</p>
        </div>
      </div>

      {/* Result panel */}
      <div className="glass relative flex flex-col gap-6 overflow-hidden rounded-hero p-6 sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-burgundy-glow/25 blur-3xl" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">{labels.resultEyebrow}</span>
          <LiveBadge>{labels.exact}</LiveBadge>
        </div>
        <div>
          <div dir="ltr" className="flex items-baseline gap-1">
            <AnimatedPercent value={pct} locale={locale} />
          </div>
          <p className="mt-2 text-muted">{labels.perPregnancy}</p>
          <p className="mt-1 text-sm text-muted tabular">{formula}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted uppercase tracking-[0.12em]">
            <span>{labels.affected}</span>
            <span className="tabular" dir="ltr">{toPercentString(result.combined)}%</span>
          </div>
          <DotMeter total={48} filled={Math.round((pct / 100) * 48)} label={`${labels.meterLabel}: ${toPercentString(result.combined)}%`} />
        </div>
        <dl className="grid grid-cols-3 gap-3">
          <Tile label={multi ? labels.perGene : labels.affected} value={`${toPercentString(result.one.affected)}%`} />
          <Tile label={multi ? labels.genesTile : labels.carrierChild} value={multi ? String(result.n) : `${toPercentString(result.one.carrier)}%`} highlight />
          <Tile label={multi ? labels.combinedTile : labels.neither} value={multi ? `${toPercentString(result.combined)}%` : `${toPercentString(result.one.nonCarrier)}%`} />
        </dl>
        <div className="mt-auto flex flex-col gap-3">
          <LinkButton href={ctaHref} size="lg" block>{labels.cta}</LinkButton>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <SafetyPill kind="education" label={labels.education} />
            <span>{labels.disclaimer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Segmented({ label, value, onChange, on, off }: { label: string; value: boolean; onChange: (v: boolean) => void; on: string; off: string }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-base text-ink">{label}</span>
      <div role="radiogroup" aria-label={label} className="glass grid grid-cols-2 rounded-full p-1">
        {[
          { v: false, t: off },
          { v: true, t: on },
        ].map((o) => (
          <button
            key={String(o.v)}
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "h-11 rounded-full px-4 text-sm transition-[background,color,box-shadow] duration-500 ease-calm",
              value === o.v ? "bg-burgundy text-on-burgundy shadow-[0_0_20px_-6px_var(--burgundy-glow)]" : "text-muted hover:text-ink",
            )}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("glass flex flex-col gap-1 rounded-card p-3 sm:p-4", highlight && "border-[color-mix(in_oklab,var(--rose-light)_35%,transparent)]")}>
      <dt className="text-xs uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold text-ink tabular sm:text-2xl" dir="ltr">{value}</dd>
    </div>
  );
}

/** Large percentage that glides to each new value (exact text always matches the engine). */
function AnimatedPercent({ value, locale }: { value: number; locale: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", { maximumFractionDigits: 2, numberingSystem: "latn" }).format(n);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = fmt(value);
      prev.current = value;
      return;
    }
    const c = animate(prev.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => (el.textContent = fmt(Math.round(n * 100) / 100)),
      onComplete: () => (el.textContent = fmt(value)),
    });
    prev.current = value;
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);
  return (
    <span className="font-display text-5xl font-semibold tracking-tight text-cyan-ink tabular" aria-live="polite">
      <span ref={ref}>{fmt(value)}</span>%
    </span>
  );
}
