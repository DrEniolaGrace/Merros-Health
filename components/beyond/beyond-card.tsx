import type { User } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { HourglassMedium, LockKey } from "@phosphor-icons/react/dist/ssr";
import { GlassCard } from "@/components/ui/glass-card";
import { Eyebrow, StatRow } from "@/components/ui/accents";
import { SafetyPill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/link-button";
import { beyondStateFor } from "@/lib/services/beyond";
import { BeyondConsentSwitch, DemoSwitchPartner } from "./beyond-views";

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/**
 * Risk Beyond the Panel, as the couple sees it (SPEC 6.2). They never see the estimate before a
 * genetic counsellor has talked it through with them and released it.
 */
export async function BeyondCard({ user, partnerName, partnerPersona }: { user: User; partnerName: string; partnerPersona: string | null }) {
  const t = await getTranslations("beyond");
  const ts = await getTranslations("safety");
  const s = await beyondStateFor(user);
  if (s.state === "no_partner") return null;

  return (
    <GlassCard hero className="relative flex flex-col gap-6 overflow-hidden" data-beyond={s.state}>
      <span aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="text-gradient text-2xl font-semibold">{t("title")}</h2>
        <p className="measure text-muted">{t("body")}</p>
        <SafetyPill kind="education" label={ts("education")} className="self-start" />
      </div>

      {s.state === "unavailable" && <p className="text-sm text-muted">{t("unavailable")}</p>}

      {s.state === "needs_consent" && (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm text-muted">
            {(["point1", "point2", "point3"] as const).map((k) => <li key={k} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t(k)}</li>)}
          </ul>
          <BeyondConsentSwitch checked={s.selfConsented} label={t("consentLabel")} description={t("consentDesc")} />
          <p className="text-sm text-ink" data-beyond-partner={s.partnerConsented ? "yes" : "no"}>
            {s.selfConsented ? (s.partnerConsented ? t("bothAgreed") : t("waitingPartner", { name: partnerName })) : s.partnerConsented ? t("partnerAgreed", { name: partnerName }) : t("neitherAgreed")}
          </p>
          {s.selfConsented && !s.partnerConsented && partnerPersona && <DemoSwitchPartner persona={partnerPersona} label={t("demoSwitch", { name: partnerName })} />}
        </div>
      )}

      {s.state === "with_counsellor" && (
        <div className="flex flex-col gap-4">
          <p className="flex items-start gap-3 text-ink"><HourglassMedium size={22} className="mt-0.5 shrink-0 text-gold-ink" />{t("withCounsellor")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/support" variant="gold">{t("book")}</LinkButton>
            <BeyondConsentSwitch checked label={t("consentLabel")} description={t("withdrawDesc")} />
          </div>
        </div>
      )}

      {s.state === "released" && (
        <div className="flex flex-col gap-5" data-beyond-released>
          <p className="text-lg text-ink">{t(`band.${s.result.band}`)}</p>
          <StatRow
            items={[
              { value: `${s.result.sharedPercent.toFixed(0)}%`, label: t("statShared") },
              { value: pct(s.result.childF), label: t("statChild") },
              { value: s.result.band === "background" ? "≈ 0" : `+${pct(s.result.extra.low)} – ${pct(s.result.extra.high)}`, label: t("statExtra") },
            ]}
          />
          <GlassCard tone="gold" className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-ink"><LockKey size={16} className="text-gold-ink" />{t("nadTitle")}</p>
            <p className="measure text-sm text-muted">{t("nadBody")}</p>
          </GlassCard>
          <p className="measure text-xs text-muted">{t("method")}</p>
          <BeyondConsentSwitch checked label={t("consentLabel")} description={t("withdrawDesc")} />
        </div>
      )}
      <p className="text-xs text-gold-ink">{t("synthetic")}</p>
    </GlassCard>
  );
}
