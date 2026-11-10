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
import { ActionDock, PageHeader, SectionTitle } from "@/components/ui/page";
import { Pill, SafetyPill } from "@/components/ui/pill";
import { Rise, RiseItem } from "@/components/ui/rise";
import { Disclosure } from "@/components/ui/disclosure";
import { conditionById } from "@/content/conditions";
import { CARRIER_MEANING, LIMITS, NOT_A_DIAGNOSIS, NO_VARIANTS } from "@/content/explainer";
import { pick } from "@/content/types";
import { LAB_NAME } from "@/content/personas";

export default async function ResultPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("result");
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
  const hasPartner = (await prisma.coupleLink.count({ where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] } })) > 0;
  const name = (id: string) => {
    const c = conditionById(id);
    return c ? pick(c.name, locale) : id;
  };

  return (
    <Rise className="flex flex-col gap-8">
      <RiseItem>
        <PageHeader title={t("title")} label={{ kind: "education", text: ts("education") }}>
          <Pill tone="cyan">
            <SealCheck size={14} weight="light" />
            {t("verified", { lab: LAB_NAME })}
          </Pill>
        </PageHeader>
      </RiseItem>

      {summary.genes.map(({ gene, status }, gi) => (
        <RiseItem key={gene}>
          <GlassCard tone={status.kind === "carrier" ? "default" : "gold"} className="flex flex-col gap-4">
            {status.kind === "carrier" ? (
              <>
                <h2 className="text-2xl font-medium">{t("carrierOf", { condition: name(status.variants[0].conditionId) })}</h2>
                {gi === summary.genes.findIndex((g) => g.status.kind === "carrier") && (
                  <p className="measure text-ink">{pick(CARRIER_MEANING.body[level], locale)}</p>
                )}
              </>
            ) : (
              <h2 className="text-2xl font-medium">{t("counsellorFinding")}</h2>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">{t("gene")}</dt>
                <dd className="font-medium tabular" dir="ltr">{gene}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">{t("variant")}</dt>
                <dd className="break-words tabular" dir="ltr">{status.kind !== "not_carrier" && status.variants[0].hgvs}</dd>
              </div>
              {status.kind !== "not_carrier" && status.variants[0].clinvarId && (
                <div>
                  <dt className="text-muted">{t("clinvar")}</dt>
                  <dd className="tabular" dir="ltr">VCV{status.variants[0].clinvarId.padStart(9, "0")}</dd>
                </div>
              )}
            </dl>
            {status.kind !== "not_carrier" && (
              <div>
                <LinkButton href={`/learn/${status.variants[0].conditionId}`} variant="ghost" iconEnd={<ArrowRight size={18} />} className="-ms-4">
                  {t("learnCondition", { condition: name(status.variants[0].conditionId) })}
                </LinkButton>
              </div>
            )}
          </GlassCard>
        </RiseItem>
      ))}

      {summary.vus.map((v) => (
        <RiseItem key={v.hgvs}>
          <GlassCard className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-gold-ink">
              <Info size={20} />
              <h2 className="text-xl font-medium text-ink">{t("vusTitle")}</h2>
            </div>
            <p className="text-muted">{t("vusBody", { gene: v.gene })}</p>
            <p className="break-words text-sm tabular text-muted" dir="ltr">{v.hgvs}{v.clinvarId ? ` · VCV${v.clinvarId.padStart(9, "0")}` : ""}</p>
            <p className="measure text-sm text-ink">{pick(LIMITS.items[2].body, locale)}</p>
          </GlassCard>
        </RiseItem>
      ))}

      {summary.genes.length === 0 && summary.vus.length === 0 && (
        <RiseItem>
          <GlassCard className="flex flex-col gap-3">
            <h2 className="text-2xl font-medium">{t("noVariantsTitle")}</h2>
            <p className="measure">{pick(NO_VARIANTS.body[level], locale)}</p>
          </GlassCard>
        </RiseItem>
      )}

      <RiseItem>
        <GlassCard tone="gold" className="flex flex-col gap-2" aria-labelledby="nad">
          <h2 id="nad" className="text-lg font-medium text-gold-ink">{pick(NOT_A_DIAGNOSIS.title, locale)}</h2>
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
