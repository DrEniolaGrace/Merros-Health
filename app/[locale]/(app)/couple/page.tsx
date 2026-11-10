import { getTranslations, setRequestLocale } from "next-intl/server";
import { LockKey, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { getCoupleView } from "@/lib/services/results";
import { refreshEscalations } from "@/lib/services/escalation";
import { toNumber, toPercentString } from "@/lib/risk/fraction";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { ActionDock } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";
import { CountUp } from "@/components/ui/motion";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import { PageHero } from "@/components/ui/page-hero";
import { DualKey } from "@/components/risk/dual-key";
import { conditionById } from "@/content/conditions";
import { LIMITS, NOT_A_DIAGNOSIS } from "@/content/explainer";
import { pick } from "@/content/types";
import { ConsentButton } from "./consent-button";
import { CoupleNumbers } from "./couple-numbers";

export default async function CouplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("couple");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tds = await getTranslations("ds");
  const view = await getCoupleView(user);
  const me = locale === "ar" ? user.displayNameAr : user.displayNameEn;

  if (view.status === "no_partner") {
    return <GlassCard><EmptyState title={t("noPartnerTitle")} body={t("noPartnerBody")} /></GlassCard>;
  }
  if (view.status === "awaiting_consent") {
    return (
      <PageHero
        eyebrow={tp("eyebrowCouple")}
        title={view.selfConsented ? t("awaitingPartnerTitle") : t("awaitingSelfTitle")}
        body={view.selfConsented ? t("awaitingPartnerBody") : t("awaitingSelfBody")}
        badges={<LiveBadge tone={view.selfConsented ? "gold" : "rose"}>{view.selfConsented ? t("youAgreed") : t("sealedBadge")}</LiveBadge>}
        aside={
          <DualKey
            label={t("dualKeyLabel")}
            you={{ name: me, status: view.selfConsented ? t("agreedStatus") : t("notYetStatus") }}
            partner={{ name: t("partner"), status: t("notYetStatus") }}
            youAgreed={view.selfConsented}
            partnerAgreed={false}
          />
        }
      >
        {!view.selfConsented && (
          <div>
            <ConsentButton label={t("agree")} />
          </div>
        )}
      </PageHero>
    );
  }
  if (view.status === "awaiting_results") {
    return <GlassCard><EmptyState title={t("awaitingResultsTitle")} body={t("awaitingResultsBody")} /></GlassCard>;
  }

  await refreshEscalations(user);
  const partner = locale === "ar" ? view.partnerName.ar : view.partnerName.en;
  const cname = (ids: string[]) => ids.map((id) => (conditionById(id) ? pick(conditionById(id)!.name, locale) : id)).join(" / ");
  const combinedPct = toNumber(view.combinedAffected) * 100;
  const decimals = Number.isInteger(combinedPct) ? 0 : 2;

  return (
    <Rise className="flex flex-col gap-10">
      <RiseItem>
        <PageHero
          eyebrow={tp("eyebrowCouple")}
          title={t("title")}
          accent={view.shared.length ? t("heroAccentShared", { count: view.shared.length }) : t("heroAccentNone")}
          label={{ kind: "education", text: ts("education") }}
          badges={
            <>
              <LiveBadge tone="gold">{t("bothAgreed")}</LiveBadge>
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <UsersThree size={16} weight="light" />
                {t("with", { name: partner })}
              </span>
            </>
          }
          aside={
            <DualKey
              label={t("dualKeyLabel")}
              you={{ name: me, status: t("agreedStatus") }}
              partner={{ name: partner, status: t("agreedStatus") }}
              youAgreed
              partnerAgreed
              shared={view.shared.map((s) => s.gene)}
            />
          }
        />
      </RiseItem>

      <RiseItem>
        <StatRow
          items={[
            { value: <CountUp value={view.shared.length} locale={locale} />, label: t("statShared") },
            { value: <CountUp value={combinedPct} decimals={decimals} suffix="%" locale={locale} />, label: t("statCombined") },
            { value: <CountUp value={0} locale={locale} />, label: t("statSeen") },
          ]}
        />
      </RiseItem>

      {view.shared.length === 0 ? (
        <RiseItem>
          <GlassCard className="flex flex-col gap-3">
            <h2 className="text-2xl font-medium">{t("noneSharedTitle")}</h2>
            <p className="measure text-muted">{t("noneSharedBody")}</p>
            <p className="measure text-sm text-muted">{pick(LIMITS.items[1].body, locale)}</p>
          </GlassCard>
        </RiseItem>
      ) : (
        <RiseItem>
          <CoupleNumbers
            locale={locale}
            genes={view.shared.map((g) => ({
              gene: g.gene,
              title: t("sharedTitle", { gene: g.gene }),
              perPregnancy: t("perPregnancy", { condition: cname(g.conditionIds) }),
              affectedPct: toNumber(g.affected) * 100,
              carrierText: t("carrierChance", { pct: toPercentString(g.carrier) }),
            }))}
            combined={
              view.shared.length > 1
                ? {
                    pct: combinedPct,
                    exact: toPercentString(view.combinedAffected),
                    title: t("combinedTitle"),
                    body: t("combinedBody"),
                    how: t("combinedHow"),
                    hundred: Math.round(combinedPct),
                    hundredSummary: t("hundredSummary", { n: Math.round(combinedPct) }),
                    notAffected: t("notAffected"),
                  }
                : null
            }
            gridLabels={{
              title: tds("fourSquare"),
              parentA: tds("parentA"),
              parentB: tds("parentB"),
              nonCarrier: tds("nonCarrier"),
              carrier: tds("carrier"),
              affected: tds("affected"),
              summary: tds("fourSummary"),
            }}
          />
        </RiseItem>
      )}

      <RiseItem>
        <GlassCard tone="gold" hero className="flex flex-col gap-2">
          <h2 className="text-gradient-gold text-xl font-semibold">{pick(NOT_A_DIAGNOSIS.title, locale)}</h2>
          <p className="measure">{pick(NOT_A_DIAGNOSIS.body, locale)}</p>
        </GlassCard>
      </RiseItem>

      <RiseItem className="glass corner-dots flex flex-col gap-2 rounded-card p-6 text-sm text-muted">
        <p className="flex items-start gap-2 text-ink"><LockKey size={16} weight="light" className="mt-1 shrink-0 text-gold-ink" />{t("privacyNote")}</p>
        <p className="measure">{t("phaseNote")}</p>
      </RiseItem>

      <RiseItem>
        <ActionDock>
          <LinkButton href="/support" size="lg">{t("talk")}</LinkButton>
        </ActionDock>
      </RiseItem>
    </Rise>
  );
}
