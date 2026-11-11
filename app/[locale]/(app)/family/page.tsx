import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOwnResult } from "@/lib/services/results";
import { summarisePerson } from "@/lib/risk/engine";
import { RELATIONS, assess, expectedYield, type Relation, type Relative } from "@/lib/family/engine";
import { frequencyFor } from "@/lib/family/frequencies";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { SectionTitle } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import { PageHero } from "@/components/ui/page-hero";
import { Pill, SafetyPill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { Constellation } from "@/components/family/constellation";
import { AddRelative, InviteLink, RemoveRelative } from "./family-forms";
import { cn } from "@/lib/cn";

export default async function FamilyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ gene?: string; related?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("family");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");
  const sp = await searchParams;

  const own = await getOwnResult(user, { log: false });
  const genes = own.status === "ok" ? summarisePerson(own.result.variants).genes.filter((g) => g.status.kind === "carrier").map((g) => g.gene) : [];
  if (genes.length === 0) {
    return (
      <GlassCard>
        <EmptyState title={t("noCarrierTitle")} body={t("noCarrierBody")} action={<LinkButton href="/result" variant="secondary">{t("noCarrierAction")}</LinkButton>} />
      </GlassCard>
    );
  }
  const gene = genes.includes(sp.gene ?? "") ? sp.gene! : genes[0];
  const related = sp.related === "1";
  const freq = frequencyFor(gene);
  const [nodes, invites] = await Promise.all([
    prisma.pedigreeNode.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.relativeInvite.findMany({ where: { userId: user.id } }),
  ]);
  const relatives: Relative[] = nodes.map((n) => ({ id: n.id, relation: n.relation as Relation, side: n.side as Relative["side"], planning: n.planning, tested: n.tested as Relative["tested"] }));
  const risks = assess(relatives, freq.f, { parentsRelated: related }).map((r) => ({ ...r, planning: nodes.find((n) => n.id === r.id)!.planning }));
  const relLabels = Object.fromEntries(RELATIONS.map((r) => [r, t(`rel.${r}`)])) as Record<Relation, string>;
  const sideLabel = (s: string) => (s === "maternal" ? t("sideMaternal") : s === "paternal" ? t("sidePaternal") : "");
  const pct = (p: number) => `${(Math.round(p * 1000) / 10).toString()}%`;
  const href = (g: string, rel: boolean) => `/family?gene=${g}${rel ? "&related=1" : ""}`;

  return (
    <Rise className="flex flex-col gap-10">
      <RiseItem>
        <PageHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          accent={t("accent")}
          body={t("body")}
          label={{ kind: "education", text: ts("education") }}
          badges={<LiveBadge tone="gold">{t("noNames")}</LiveBadge>}
        />
      </RiseItem>

      <RiseItem className="flex flex-wrap items-center gap-2">
        {genes.length > 1 &&
          genes.map((g) => (
            <Link key={g} href={href(g, related)} className={cn("rounded-full border px-4 py-2 text-sm transition-colors duration-500", g === gene ? "border-transparent bg-burgundy text-on-burgundy" : "border-glass-border text-muted hover:text-ink")}>
              <span dir="ltr">{g}</span>
            </Link>
          ))}
        <Link href={href(gene, !related)} role="switch" aria-checked={related} className={cn("rounded-full border px-4 py-2 text-sm transition-colors duration-500", related ? "border-[color-mix(in_oklab,var(--pearl-gold)_50%,transparent)] text-gold-ink" : "border-glass-border text-muted hover:text-ink")}>
          {t("parentsRelated")}
        </Link>
      </RiseItem>

      <RiseItem>
        <StatRow
          items={[
            { value: String(risks.length), label: t("statRelatives") },
            { value: expectedYield(risks).toFixed(1), label: t("statYield") },
            { value: pct(freq.f), label: t("statFrequency", { gene }) },
            { value: String(invites.length), label: t("statInvites") },
          ]}
        />
      </RiseItem>

      {risks.length === 0 ? (
        <RiseItem>
          <GlassCard><EmptyState title={t("emptyTitle")} body={t("emptyBody")} /></GlassCard>
        </RiseItem>
      ) : (
        <RiseItem className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="corner-dots">
            <Constellation risks={risks} labels={relLabels} you={t("you")} summary={t("constellationSummary", { count: risks.length })} />
          </GlassCard>
          <div className="flex flex-col gap-3">
            <SectionTitle>{t("ranked")}</SectionTitle>
            <ol className="flex flex-col gap-2">
              {risks.map((r, i) => (
                <li key={r.id} className="glass flex items-center gap-3 rounded-control py-2 pe-1 ps-4" data-relative={r.relation}>
                  <span className="w-5 shrink-0 text-xs text-muted tabular">{r.basis === "tested" ? "" : i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
                      {relLabels[r.relation]}
                      {sideLabel(r.side) && <span className="text-xs text-muted">{sideLabel(r.side)}</span>}
                      {r.planning && <Pill tone="gold">{t("planningTag")}</Pill>}
                      {r.basis === "tested" && <Pill tone="cyan">{r.probability === 1 ? t("testedCarrier") : t("testedNot")}</Pill>}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-glass-strong">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--burgundy-glow),var(--rose-light))]" style={{ width: `${Math.max(r.probability * 100, 2)}%` }} />
                    </div>
                  </div>
                  <span className="w-14 shrink-0 text-end font-display text-lg text-cyan-ink tabular" dir="ltr">{pct(r.probability)}</span>
                  <RemoveRelative id={r.id} label={t("remove")} />
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted">{t("rankNote")}</p>
          </div>
        </RiseItem>
      )}

      <RiseItem>
        <GlassCard className="flex flex-col gap-4">
          <SectionTitle>{t("addTitle")}</SectionTitle>
          <p className="text-sm text-muted">{t("addBody")}</p>
          <AddRelative
            labels={{
              relation: t("relation"),
              side: t("side"),
              tested: t("tested"),
              planning: t("planning"),
              add: t("add"),
              relations: relLabels,
              sides: { unknown: t("sideUnknown"), maternal: t("sideMaternal"), paternal: t("sidePaternal") },
              testedOptions: { unknown: t("testedUnknown"), carrier: t("testedCarrier"), not_carrier: t("testedNot") },
            }}
          />
        </GlassCard>
      </RiseItem>

      <RiseItem>
        <GlassCard tone="gold" hero className="flex flex-col gap-4">
          <h2 className="text-gradient-gold text-xl font-semibold">{t("inviteTitle")}</h2>
          <p className="measure text-ink">{t("inviteBody")}</p>
          <InviteLink locale={locale} labels={{ create: t("inviteCreate"), copy: t("inviteCopy"), copied: t("inviteCopied"), hint: t("inviteHint") }} />
        </GlassCard>
      </RiseItem>

      <RiseItem className="flex flex-col gap-2 text-sm text-muted">
        <p className="measure">{t("method", { gene, f: pct(freq.f), population: freq.population })}</p>
        {related && <p className="measure text-gold-ink">{t("relatedNote")}</p>}
        <SafetyPill kind="education" label={`${ts("education")} · ${tc("pendingReview")}`} className="self-start" />
      </RiseItem>
    </Rise>
  );
}
