import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Info, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOwnResult } from "@/lib/services/results";
import { summarisePerson } from "@/lib/risk/engine";
import { requestMedicalAdvice } from "@/lib/actions/patient";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { ActionDock, SectionTitle } from "@/components/ui/page";
import { YourPlan } from "@/components/plan/your-plan";
import { planLabels } from "@/lib/plan/labels";
import { Pill, SafetyPill } from "@/components/ui/pill";
import { Rise, RiseItem } from "@/components/ui/rise";
import { Disclosure } from "@/components/ui/disclosure";
import { CountUp } from "@/components/ui/motion";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import { GeneOrb, PageHero } from "@/components/ui/page-hero";
import { CopyPair } from "@/components/risk/copy-pair";
import { conditionById } from "@/content/conditions";
import { CARRIER_MEANING, LIMITS, NOT_A_DIAGNOSIS, NO_VARIANTS } from "@/content/explainer";
import { pick } from "@/content/types";
import { LAB_NAME } from "@/content/personas";

export default async function ResultPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("result");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");
  const level = user.profile?.readingLevel ?? "standard";
  const own = await getOwnResult(user);

  if (own.status === "no_consent") {
    return (
      <GlassCard>
        <EmptyState title={t("noConsentTitle")} body={t("noConsentBody")} action={<LinkButton href="/privacy" variant="secondary">{tc("continue")}</LinkButton>} />
      </GlassCard>
    );
  }
  if (own.status === "waiting") {
    return (
      <GlassCard tone="gold">
        <EmptyState title={t("waitingTitle")} body={pick(NOT_A_DIAGNOSIS.body, locale)} action={<LinkButton href="/import" variant="gold">{t("waitingAction")}</LinkButton>} />
      </GlassCard>
    );
  }
  if (own.status === "none") {
    return (
      <GlassCard>
        <EmptyState title={t("noneTitle")} body={t("noneBody")} action={<LinkButton href="/screening">{t("noneAction")}</LinkButton>} />
      </GlassCard>
    );
  }

  const { result } = own;
  const summary = summarisePerson(result.variants);
  const carriers = summary.genes.filter((g) => g.status.kind === "carrier");
  // Every result that carries a risk ends with "Your plan": counselling, options, one next step.
  const needsSpecialist = summary.vus.length > 0 || summary.genes.some((g) => g.status.kind === "needs_counsellor");
  const planContext = needsSpecialist ? ("uncertain" as const) : carriers.length > 0 ? ("carrier" as const) : null;
  const planNext = planContext === "uncertain" ? ("wellbeing" as const) : ("teachback" as const);
  const plan = planContext ? await planLabels(planContext, planNext) : null;
  const hasPartner = (await prisma.coupleLink.count({ where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] } })) > 0;
  const name = (id: string) => {
    const c = conditionById(id);
    return c ? pick(c.name, locale) : id;
  };
  const heroTitle =
    summary.genes.length === 0 && summary.vus.length === 0
      ? t("noVariantsTitle")
      : carriers.length === 1
        ? t("heroOne")
        : carriers.length > 1
          ? t("heroMany", { count: carriers.length })
          : t("heroVus");

  return (
    <Rise className="flex flex-col gap-10">
      <RiseItem>
        <PageHero
          eyebrow={tp("eyebrowResult")}
          title={heroTitle}
          accent={carriers.length ? t("heroAccent") : undefined}
          label={{ kind: "education", text: ts("education") }}
          badges={
            <LiveBadge>
              <SealCheck size={12} weight="bold" />
              {t("verifiedShort")}
            </LiveBadge>
          }
          aside={carriers.length ? <CopyPair working={t("workingCopy")} changed={t("changedCopy")} label={t("copyPairLabel")} /> : undefined}
        >
          <p className="text-sm text-muted">{t("verified", { lab: LAB_NAME })}</p>
          {/-R\d+$/.test(result.accession) && <p className="measure text-sm text-gold-ink" data-updated-result>{t("updatedNote")}</p>}
        </PageHero>
      </RiseItem>

      <RiseItem>
        <StatRow
          items={[
            { value: <CountUp value={result.panelGenes.length} locale={locale} />, label: t("statTested") },
            { value: <CountUp value={carriers.length} locale={locale} />, label: t("statCarrier") },
            { value: <CountUp value={summary.vus.length} locale={locale} />, label: t("statVus") },
            { value: <CountUp value={0} locale={locale} />, label: t("statAi") },
          ]}
        />
      </RiseItem>

      {carriers.length > 0 && (
        <RiseItem>
          <GlassCard className="corner-dots flex flex-col gap-2">
            <h2 className="text-xs uppercase tracking-[0.14em] text-rose-ink">{t("meaningTitle")}</h2>
            <p className="measure text-lg text-ink">{pick(CARRIER_MEANING.body[level], locale)}</p>
          </GlassCard>
        </RiseItem>
      )}

      {summary.genes.length > 0 && (
        <RiseItem as="section" className="grid gap-4 lg:grid-cols-2">
          {summary.genes.map(({ gene, status }) => {
            const v = status.kind !== "not_carrier" ? status.variants[0] : null;
            return (
              <GlassCard key={gene} tilt tone={status.kind === "carrier" ? "default" : "gold"} className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <GeneOrb gene={gene} tone={status.kind === "carrier" ? "rose" : "gold"} size={64} />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">{status.kind === "carrier" ? t("carrierLabel") : t("counsellorFinding")}</p>
                    <h2 className="text-xl font-medium text-ink">{v ? name(v.conditionId) : gene}</h2>
                  </div>
                </div>
                {v && (
                  <dl className="grid gap-3 text-sm">
                    <div className="glass rounded-control px-4 py-3">
                      <dt className="text-xs text-muted">{t("variant")}</dt>
                      <dd className="break-words text-ink tabular" dir="ltr">{v.hgvs}</dd>
                    </div>
                    {v.clinvarId && (
                      <div className="flex items-center justify-between gap-3 px-1">
                        <dt className="text-muted">{t("clinvar")}</dt>
                        <dd className="text-ink tabular" dir="ltr">VCV{v.clinvarId.padStart(9, "0")}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {v && (
                  <div className="mt-auto">
                    <LinkButton href={`/learn/${v.conditionId}`} variant="ghost" iconEnd={<ArrowRight size={18} />} className="-ms-4">
                      {t("learnCondition", { condition: name(v.conditionId) })}
                    </LinkButton>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </RiseItem>
      )}

      {summary.vus.map((v) => (
        <RiseItem key={v.hgvs}>
          <GlassCard tone="gold" className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <GeneOrb gene={v.gene} tone="gold" size={64} />
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-medium text-ink">{t("vusTitle")}</h2>
                <LiveBadge tone="gold">
                  <Info size={12} weight="bold" />
                  {t("vusBadge")}
                </LiveBadge>
              </div>
              <p className="text-muted">{t("vusBody", { gene: v.gene })}</p>
              <p className="break-words text-sm tabular text-muted" dir="ltr">{v.hgvs}{v.clinvarId ? ` · VCV${v.clinvarId.padStart(9, "0")}` : ""}</p>
              <p className="measure text-sm text-ink">{pick(LIMITS.items[2].body, locale)}</p>
            </div>
          </GlassCard>
        </RiseItem>
      ))}

      {summary.genes.length === 0 && summary.vus.length === 0 && (
        <RiseItem>
          <GlassCard className="flex flex-col gap-3">
            <p className="measure text-lg">{pick(NO_VARIANTS.body[level], locale)}</p>
          </GlassCard>
        </RiseItem>
      )}

      <RiseItem>
        <GlassCard tone="gold" hero className="flex flex-col gap-2" aria-labelledby="nad">
          <h2 id="nad" className="text-gradient-gold text-xl font-semibold">{pick(NOT_A_DIAGNOSIS.title, locale)}</h2>
          <p className="measure text-ink">{pick(NOT_A_DIAGNOSIS.body, locale)}</p>
        </GlassCard>
      </RiseItem>

      <RiseItem className="flex flex-col gap-3">
        <SectionTitle>{t("limitsTitle")}</SectionTitle>
        <div className="glass flex flex-col divide-y divide-glass-border rounded-card">
          {LIMITS.items.map((it) => (
            <Disclosure key={it.title.en} title={pick(it.title, locale)}>
              <p className="measure text-muted">{pick(it.body, locale)}</p>
            </Disclosure>
          ))}
          <Disclosure title={t("panel")}>
            <div className="flex flex-wrap gap-2" dir="ltr">
              {result.panelGenes.map((g) => <Pill key={g}>{g}</Pill>)}
            </div>
          </Disclosure>
        </div>
        <SafetyPill kind="education" label={`${ts("education")} · ${tc("pendingReview")}`} className="self-start" />
      </RiseItem>

      {plan && planContext && (
        <RiseItem>
          <YourPlan labels={plan} context={planContext} next={planNext} />
        </RiseItem>
      )}

      <RiseItem>
        <ActionDock>
          <LinkButton href="/teach-back" size="lg" iconEnd={<ArrowRight size={20} />}>{t("checkUnderstanding")}</LinkButton>
          {hasPartner && <LinkButton href="/couple" size="lg" variant="secondary">{t("seeCouple")}</LinkButton>}
          <form action={requestMedicalAdvice}>
            <button type="submit" className="inline-flex h-14 w-full items-center justify-center rounded-control px-6 text-sm text-muted transition-colors duration-500 hover:bg-glass hover:text-ink sm:w-auto">
              {t("askAdvice")}
            </button>
          </form>
        </ActionDock>
      </RiseItem>
    </Rise>
  );
}
