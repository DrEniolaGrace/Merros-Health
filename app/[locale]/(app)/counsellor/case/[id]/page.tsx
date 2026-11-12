import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LockKey } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildBrief } from "@/lib/services/brief";
import { GlassCard } from "@/components/ui/glass-card";
import { BackLink } from "@/components/ui/back-link";
import { SectionTitle } from "@/components/ui/page";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import { GeneOrb, PageHero } from "@/components/ui/page-hero";
import { Pill, SafetyPill } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/ui/states";
import { Constellation } from "@/components/family/constellation";
import { RELATIONS, type Relation } from "@/lib/family/engine";
import { ESCALATION_TEXT } from "@/content/escalation";
import { conditionById } from "@/content/conditions";
import { pick } from "@/content/types";
import type { EscalationCode } from "@/lib/escalation/rules";
import { ReleaseButton, SummaryComposer } from "../../counsellor-actions";

export default async function CaseBriefPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const me = await requireUser(["counsellor"]);
  const t = await getTranslations("brief");
  const tc = await getTranslations("counsellor");
  const tf = await getTranslations("family");
  const ts = await getTranslations("safety");
  const brief = await buildBrief(me, id);
  if (!brief) notFound();
  const ar = locale === "ar";
  const { patient, detail } = brief;
  const name = ar ? patient.displayNameAr : patient.displayNameEn;

  if (!detail) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href="/counsellor" label={t("back")} />
        <GlassCard><EmptyState title={t("noConsentTitle")} body={tc("noAccess")} /></GlassCard>
      </div>
    );
  }

  const clinician = await prisma.clinician.findUnique({ where: { userId: me.id } });
  const d = detail;
  const appt = d.appointment;
  const mineAppt = appt && clinician && appt.clinicianId === clinician.id;
  const fmt = (dt: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(dt);
  const cls = (c: string) => tc(`class.${c}` as "class.vus");
  const relLabels = Object.fromEntries(RELATIONS.map((r) => [r, tf(`rel.${r}`)])) as Record<Relation, string>;
  const openReasons = patient.escalations.filter((e) => e.status !== "resolved");
  const tasks = patient.counsellorTasks.filter((x) => x.status === "open");
  const profile = patient.profile;

  return (
    <div className="flex flex-col gap-10">
      <BackLink href="/counsellor" label={t("back")} />
      <PageHero
        eyebrow={t("eyebrow")}
        title={name}
        accent={appt ? (appt.status === "booked" ? fmt(appt.startsAt) : t("sessionDone")) : t("noSession")}
        badges={
          <>
            <LiveBadge tone="cyan">{t("consented")}</LiveBadge>
            {profile && <Pill>{profile.locale === "ar" ? "العربية" : "English"} · {t(`level.${profile.readingLevel}` as "level.simple")}</Pill>}
            {profile && (profile.pregnancyStatus === "pregnant" || profile.pregnancyStatus === "trying") && <Pill tone="gold">{t(`preg.${profile.pregnancyStatus}` as "preg.pregnant")}</Pill>}
          </>
        }
      />

      <StatRow
        items={[
          { value: String(d.summary?.genes.length ?? 0), label: t("statGenes") },
          { value: String(d.summary?.vus.length ?? 0), label: t("statVus") },
          { value: d.scores.answered ? `${Math.round(d.scores.before * 100)}% → ${Math.round(d.scores.after * 100)}%` : t("none"), label: t("statTeach") },
          { value: d.family.length ? d.familyYield.toFixed(1) : t("none"), label: t("statYield") },
        ]}
      />

      {tasks.map((task) => (
        <GlassCard key={task.id} tone="gold" className="flex flex-col gap-3" data-task>
          <LiveBadge tone="gold" className="self-start">{tc("reclassified")}</LiveBadge>
          <p className="text-ink"><span dir="ltr" className="tabular">{task.event.gene} · VCV{task.event.clinvarId.padStart(9, "0")}</span>: <span className="text-muted">{cls(task.event.oldClass)}</span> → <strong className="text-gold-ink">{cls(task.event.newClass)}</strong></p>
          <p className="measure text-sm text-muted">{task.event.evidence}</p>
          <p className="measure text-sm text-ink">{tc("releaseHint")}</p>
          <ReleaseButton taskId={task.id} label={tc("release")} />
        </GlassCard>
      ))}

      <section className="flex flex-col gap-4">
        <SectionTitle>{t("reasons")}</SectionTitle>
        {openReasons.length ? (
          <ul className="flex flex-col gap-2">
            {openReasons.map((e) => (
              <li key={e.id} className="glass rounded-control px-4 py-3 text-sm text-ink">{pick(ESCALATION_TEXT[e.code as EscalationCode], locale)}{e.detail ? <span className="text-muted tabular" dir="ltr"> ({e.detail})</span> : null}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("noReasons")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>{t("result")}</SectionTitle>
        {d.summary && (d.summary.genes.length > 0 || d.summary.vus.length > 0) ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {d.summary.genes.map((g) => {
              const v = g.status.kind !== "not_carrier" ? g.status.variants[0] : null;
              return (
                <GlassCard key={g.gene} className="flex items-start gap-4">
                  <GeneOrb gene={g.gene} size={56} tone={g.status.kind === "carrier" ? "rose" : "gold"} />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{v ? pick(conditionById(v.conditionId)?.name ?? { en: v.conditionId, ar: v.conditionId }, locale) : g.gene}</p>
                    <p className="text-sm text-muted">{g.status.kind === "carrier" ? t("carrier") : t("needsReview")}</p>
                    {v && <p className="break-words text-xs text-muted tabular" dir="ltr">{v.hgvs} · {cls(v.acmg)}</p>}
                  </div>
                </GlassCard>
              );
            })}
            {d.summary.vus.map((v) => (
              <GlassCard key={v.hgvs} tone="gold" className="flex items-start gap-4">
                <GeneOrb gene={v.gene} size={56} tone="gold" />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{cls("vus")}</p>
                  <p className="break-words text-xs text-muted tabular" dir="ltr">{v.hgvs}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{d.resultStatus === "ok" ? t("noFindings") : t("noResult")}</p>
        )}
        <p className="flex items-start gap-2 text-sm text-muted">
          <LockKey size={16} weight="light" className="mt-1 shrink-0 text-gold-ink" />
          {d.sharedGenes.length ? t("coupleShared", { genes: d.sharedGenes.join(", ") }) : t("coupleUnknown")}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>{t("questions")}</SectionTitle>
        {d.questions.length ? (
          d.questions.map((q, i) => <GlassCard key={i}><p className="measure whitespace-pre-line text-ink" dir="auto">{q}</p></GlassCard>)
        ) : (
          <p className="text-sm text-muted">{t("noQuestions")}</p>
        )}
      </section>

      {d.family.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle>{t("pedigree", { gene: d.gene ?? "" })}</SectionTitle>
          <GlassCard className="mx-auto w-full max-w-xl">
            <Constellation risks={d.family.map((r) => ({ ...r, planning: patient.pedigree.find((n) => n.id === r.id)?.planning ?? false }))} labels={relLabels} you={name} summary={tf("constellationSummary", { count: d.family.length })} />
          </GlassCard>
          <p className="text-xs text-muted">{t("pedigreeNote")}</p>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <SectionTitle>{t("afterSession")}</SectionTitle>
        {mineAppt ? (
          <GlassCard className="flex flex-col gap-4">
            <p className="measure text-sm text-muted">{t("summaryIntro")}</p>
            <SafetyPill kind="clinical_advice" label={ts("clinical_advice")} className="self-start" />
            <SummaryComposer
              appointmentId={appt!.id}
              initialNotes={d.notes}
              initialSummary={d.summaryText}
              labels={{
                notesLabel: t("notesLabel"),
                notesPlaceholder: t("notesPlaceholder"),
                draft: t("draft"),
                draftLabel: t("draftLabel", { language: profile?.locale === "ar" ? "العربية" : "English" }),
                draftHint: t("draftHint"),
                sign: t("sign"),
                signed: t("signed"),
                offline: t("offline"),
                dir: profile?.locale === "ar" ? "rtl" : "ltr",
              }}
            />
            {appt!.mode === "video" && appt!.status === "booked" && <LinkButton href={`/session/${appt!.id}`} variant="ghost" className="self-start">{t("joinVideo")}</LinkButton>}
          </GlassCard>
        ) : (
          <p className="text-sm text-muted">{t("noSessionWithYou")}</p>
        )}
      </section>
    </div>
  );
}
