import { getTranslations, setRequestLocale } from "next-intl/server";
import { LockKey, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { getCoupleView } from "@/lib/services/results";
import { refreshEscalations } from "@/lib/services/escalation";
import { toNumber, toPercentString } from "@/lib/risk/fraction";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { ActionDock, PageHeader } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";
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

  if (view.status === "no_partner") {
    return <GlassCard><EmptyState title={t("noPartnerTitle")} body={t("noPartnerBody")} /></GlassCard>;
  }
  if (view.status === "awaiting_consent") {
    return (
      <GlassCard tone="gold" hero className="flex flex-col items-start gap-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pearl-gold)_18%,transparent)] text-gold-ink">
          <LockKey size={30} weight="light" />
        </span>
        <h1 className="text-3xl font-semibold">{view.selfConsented ? t("awaitingPartnerTitle") : t("awaitingSelfTitle")}</h1>
        <p className="measure text-muted">{view.selfConsented ? t("awaitingPartnerBody") : t("awaitingSelfBody")}</p>
        {!view.selfConsented && <ConsentButton label={t("agree")} />}
      </GlassCard>
    );
  }
  if (view.status === "awaiting_results") {
    return <GlassCard><EmptyState title={t("awaitingResultsTitle")} body={t("awaitingResultsBody")} /></GlassCard>;
  }

  await refreshEscalations(user);
  const partner = locale === "ar" ? view.partnerName.ar : view.partnerName.en;
  const cname = (ids: string[]) => ids.map((id) => (conditionById(id) ? pick(conditionById(id)!.name, locale) : id)).join(" / ");

  return (
    <Rise className="flex flex-col gap-8">
      <RiseItem>
        <PageHeader eyebrow={tp("eyebrowCouple")} title={t("title")} label={{ kind: "education", text: ts("education") }}>
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <UsersThree size={16} weight="light" />
            {t("with", { name: partner })}
          </span>
        </PageHeader>
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
                    pct: toNumber(view.combinedAffected) * 100,
                    exact: toPercentString(view.combinedAffected),
                    title: t("combinedTitle"),
                    body: t("combinedBody"),
                    how: t("combinedHow"),
                    hundred: Math.round(toNumber(view.combinedAffected) * 100),
                    hundredSummary: t("hundredSummary", { n: Math.round(toNumber(view.combinedAffected) * 100) }),
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
        <GlassCard tone="gold" className="flex flex-col gap-2">
          <h2 className="text-lg font-medium text-gold-ink">{pick(NOT_A_DIAGNOSIS.title, locale)}</h2>
          <p className="measure">{pick(NOT_A_DIAGNOSIS.body, locale)}</p>
        </GlassCard>
      </RiseItem>

      <RiseItem className="flex flex-col gap-2 text-sm text-muted">
        <p className="flex items-start gap-2"><LockKey size={16} weight="light" className="mt-1 shrink-0" />{t("privacyNote")}</p>
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
