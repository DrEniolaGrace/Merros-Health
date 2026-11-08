"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { CountUp } from "@/components/ui/motion";
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
          <GlassCard key={g.gene} tone="gold" className="flex flex-col gap-4">
            <h2 className="text-xl font-medium">{g.title}</h2>
            <div dir="ltr" className="flex items-baseline gap-2 self-start">
              <CountUp value={g.affectedPct} decimals={decimals(g.affectedPct)} suffix="%" locale={locale} className="font-display text-5xl font-semibold text-cyan-ink" />
            </div>
            <p className="-mt-2 text-muted">{g.perPregnancy}</p>
            <FourSquareGrid labels={gridLabels} />
            <p className="text-sm text-muted">{g.carrierText}</p>
          </GlassCard>
        ))}
      </div>
      {combined && (
        <GlassCard hero className="grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-medium">{combined.title}</h2>
            <div dir="ltr" className="self-start">
              <CountUp value={combined.pct} decimals={decimals(combined.pct)} suffix="%" locale={locale} className="font-display text-5xl font-semibold text-cyan-ink" />
            </div>
            <p className="text-muted">{combined.body}</p>
            <p className="text-sm text-muted tabular">{combined.how}</p>
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
