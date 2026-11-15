import { getTranslations } from "next-intl/server";
import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionTitle } from "@/components/ui/page";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import type { BeyondPanelResult } from "@/lib/beyond/engine";
import { ChromosomeMap, ReleaseBeyondButton } from "./beyond-views";

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** Counsellor only view of Risk Beyond the Panel: the estimate, how it was derived, its limits, and the release step. */
export async function CounsellorBeyond({ analysis }: { analysis: { id: string; status: string; source: string; result: BeyondPanelResult } }) {
  const t = await getTranslations("beyond");
  const r = analysis.result;
  const released = analysis.status === "released";
  return (
    <section className="flex flex-col gap-4" data-counsellor-beyond={analysis.status}>
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle>{t("title")}</SectionTitle>
        <LiveBadge tone="gold">{t("counsellorOnly")}</LiveBadge>
        {released && <LiveBadge tone="cyan">{t("releasedBadge")}</LiveBadge>}
      </div>
      <GlassCard className="flex flex-col gap-6">
        <p className="text-lg text-ink">{t(`band.${r.band}`)}</p>
        <StatRow
          items={[
            { value: r.kinship.toFixed(4), label: t("cKinship") },
            { value: r.expectedKinship.toFixed(4), label: t("cExpected", { relationship: t(`rel.${r.declared}`) }) },
            { value: pct(r.childF), label: t("cChildF") },
            { value: r.band === "background" ? "≈ 0" : `+${pct(r.extra.low)} – ${pct(r.extra.high)}`, label: t("cExtra") },
          ]}
        />
        <p data-beyond-consistency={r.consistency} className={r.consistency === "consistent" ? "flex items-start gap-2 text-sm text-cyan-ink" : "flex items-start gap-2 text-sm text-gold-ink"}>
          {r.consistency === "consistent" ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <Warning size={18} className="mt-0.5 shrink-0" />}
          {t(`consistency.${r.consistency}`, { relationship: t(`rel.${r.declared}`) })}
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{t("mapTitle", { mb: Math.round(r.sharedMb), n: r.segments.length, pct: r.sharedPercent.toFixed(1) })}</p>
          <ChromosomeMap segments={r.segments} label={t("mapLabel")} />
        </div>
        <ul className="flex flex-col gap-2 text-sm text-muted">
          {(["limit1", "limit2", "limit3", "limit4"] as const).map((k) => <li key={k} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t(k)}</li>)}
        </ul>
        <p className="text-xs text-muted">{t("references")}</p>
        <p className="text-xs text-gold-ink">{analysis.source === "precomputed" ? t("sourcePrecomputed") : t("sourceService")}</p>
        {!released && (
          <div className="flex flex-col gap-2 border-t border-glass-border pt-5">
            <p className="text-sm text-muted">{t("releaseBody")}</p>
            <ReleaseBeyondButton analysisId={analysis.id} label={t("release")} />
          </div>
        )}
      </GlassCard>
    </section>
  );
}
