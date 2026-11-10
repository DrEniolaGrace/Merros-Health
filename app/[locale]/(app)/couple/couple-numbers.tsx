"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { CountUp } from "@/components/ui/motion";
import { DotMeter, LiveBadge } from "@/components/ui/accents";
import { GeneOrb } from "@/components/ui/page-hero";
import { FourSquareGrid, HundredGrid, Legend, type FourSquareLabels } from "@/components/risk/grids";

/** Couple risk numbers. All values arrive precomputed by the tested risk engine. */
export function CoupleNumbers({
  locale,
  genes,
  combined,
  gridLabels,
}: {
  locale: string;
  genes: { gene: string; title: string; perPregnancy: string; affectedPct: number; carrierText: string }[];
  combined: { pct: number; exact: string; title: string; body: string; how: string; hundred: number; hundredSummary: string; notAffected: string } | null;
  gridLabels: FourSquareLabels;
}) {
  const decimals = (n: number) => (Number.isInteger(n) ? 0 : 2);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {genes.map((g) => (
          <GlassCard key={g.gene} tone="gold" className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <GeneOrb gene={g.gene} tone="gold" size={60} />
              <h2 className="text-xl font-medium">{g.title}</h2>
            </div>
            <div className="flex flex-col gap-1">
              <div dir="ltr" className="self-start">
                <CountUp value={g.affectedPct} decimals={decimals(g.affectedPct)} suffix="%" locale={locale} className="font-display text-5xl font-semibold text-cyan-ink" />
              </div>
              <p className="text-muted">{g.perPregnancy}</p>
            </div>
            <DotMeter total={40} filled={Math.round((g.affectedPct / 100) * 40)} label={g.perPregnancy} />
            <FourSquareGrid labels={gridLabels} />
            <p className="text-sm text-muted">{g.carrierText}</p>
          </GlassCard>
        ))}
      </div>
      {combined && (
        <GlassCard hero className="relative grid items-center gap-8 overflow-hidden md:grid-cols-2">
          <span aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--data-cyan)_18%,transparent)] blur-3xl" />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-medium">{combined.title}</h2>
              <LiveBadge>{combined.exact}%</LiveBadge>
            </div>
            <div dir="ltr" className="self-start">
              <CountUp value={combined.pct} decimals={decimals(combined.pct)} suffix="%" locale={locale} className="font-display text-5xl font-semibold text-cyan-ink" />
            </div>
            <p className="text-muted">{combined.body}</p>
            <p className="glass rounded-control px-4 py-3 text-sm text-ink tabular">{combined.how}</p>
          </div>
          <div className="flex flex-col gap-4">
            <HundredGrid affected={combined.hundred} summary={combined.hundredSummary} />
            <Legend items={[{ kind: "affected", label: gridLabels.affected }, { kind: "non", label: combined.notAffected }]} />
          </div>
        </GlassCard>
      )}
    </div>
  );
}
