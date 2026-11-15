import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, LockKey } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { hasActiveConsent } from "@/lib/consent/check";
import { GlassCard } from "@/components/ui/glass-card";
import { Monogram } from "@/components/ui/avatar";
import { SectionTitle } from "@/components/ui/page";
import { LinkButton } from "@/components/ui/link-button";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import { PageHero } from "@/components/ui/page-hero";
import { Rise, RiseItem } from "@/components/ui/rise";
import { EmptyState } from "@/components/ui/states";
import { ESCALATION_TEXT, SEVERITY_TEXT } from "@/content/escalation";
import { pick } from "@/content/types";
import type { EscalationCode } from "@/lib/escalation/rules";
import { CompleteButton, ReleaseButton, SimulateUpdate } from "./counsellor-actions";

const RANK: Record<string, number> = { urgent: 0, high: 1, routine: 2 };

export default async function CounsellorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(["counsellor"]);
  const t = await getTranslations("counsellor");
  const tp = await getTranslations("page");
  const ar = locale === "ar";

  const [escalations, tasks] = await Promise.all([
    prisma.escalation.findMany({
      where: { status: { in: ["open", "booked", "pending_counsellor"] } },
      include: { user: { include: { consents: true, appointments: { where: { status: "booked" }, orderBy: { startsAt: "asc" } } } } },
    }),
    prisma.counsellorTask.findMany({ where: { status: "open" }, include: { event: true, user: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const byUser = new Map<string, typeof escalations>();
  for (const e of escalations) byUser.set(e.userId, [...(byUser.get(e.userId) ?? []), e]);
  // Urgency order (SPEC 7.1): pregnant and distress (urgent) first, then Living Results changes, then the rest.
  const cases = [...byUser.values()]
    .map((es) => ({
      user: es[0].user,
      reasons: es.sort((a, b) => RANK[a.severity] - RANK[b.severity]),
      top: Math.min(...es.map((e) => RANK[e.severity])),
      reclass: es.some((e) => e.code === "variant_reclassified") ? 0 : 1,
    }))
    .sort((a, b) => a.top - b.top || a.reclass - b.reclass || +a.reasons[0].createdAt - +b.reasons[0].createdAt);
  const fmt = (d: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);
  const cls = (c: string) => t(`class.${c}` as "class.vus");

  return (
    <Rise className="flex flex-col gap-10">
      <RiseItem>
        <PageHero eyebrow={tp("eyebrowCases")} title={t("title")} accent={t("accent")} body={t("body")} badges={<LiveBadge tone={tasks.length ? "gold" : "cyan"}>{t("tasksBadge", { count: tasks.length })}</LiveBadge>} />
      </RiseItem>
      <RiseItem>
        <StatRow
          items={[
            { value: String(cases.length), label: t("statCases") },
            { value: String(cases.filter((c) => c.top === 0).length), label: t("statUrgent") },
            { value: String(tasks.length), label: t("statTasks") },
            { value: String(cases.filter((c) => c.user.appointments.length).length), label: t("statBooked") },
          ]}
        />
      </RiseItem>

      <RiseItem className="flex flex-col gap-4">
        <SectionTitle>{t("livingTitle")}</SectionTitle>
        {tasks.length === 0 ? (
          <GlassCard className="flex flex-col gap-4">
            <p className="measure text-sm text-muted">{t("livingEmpty")}</p>
            {env().DEMO_MODE === "true" && <SimulateUpdate label={t("simulate")} done={t.raw("simulateDone")} />}
          </GlassCard>
        ) : (
          tasks.map((task) => (
            <GlassCard key={task.id} tone="gold" className="flex flex-col gap-4" data-task>
              <div className="flex flex-wrap items-center gap-3">
                <Monogram name={ar ? task.user.displayNameAr : task.user.displayNameEn} size={40} />
                <p className="text-lg font-medium">{ar ? task.user.displayNameAr : task.user.displayNameEn}</p>
                <LiveBadge tone="gold">{t("reclassified")}</LiveBadge>
              </div>
              <p className="text-ink">
                <span dir="ltr" className="tabular">{task.event.gene} · VCV{task.event.clinvarId.padStart(9, "0")}</span>
                <br />
                <span className="text-muted">{cls(task.event.oldClass)}</span> <ArrowRight size={14} className="inline rtl:-scale-x-100" /> <strong className="text-gold-ink">{cls(task.event.newClass)}</strong>
              </p>
              <p className="measure text-sm text-muted">{task.event.evidence}</p>
              <p className="measure text-sm text-ink">{t("releaseHint")}</p>
              <ReleaseButton taskId={task.id} label={t("release")} />
            </GlassCard>
          ))
        )}
      </RiseItem>

      <RiseItem className="flex flex-col gap-4">
        <SectionTitle>{t("queueTitle")}</SectionTitle>
        {cases.length === 0 ? (
          <GlassCard><EmptyState title={t("emptyTitle")} body={t("emptyBody")} /></GlassCard>
        ) : (
          <ul className="flex flex-col gap-4">
            {cases.map((c) => {
              const consented = hasActiveConsent(c.user.consents, "counsellor_access");
              const appt = c.user.appointments[0];
              return (
                <li key={c.user.id}>
                  <GlassCard tone={c.top === 0 ? "gold" : "default"} className="flex flex-col gap-4" data-case={c.user.personaKey}>
                    <div className="flex items-center gap-3">
                      <Monogram name={ar ? c.user.displayNameAr : c.user.displayNameEn} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-medium">{ar ? c.user.displayNameAr : c.user.displayNameEn}</p>
                        <p className="text-sm text-muted">{t("appointment")}: <span className="tabular">{appt ? fmt(appt.startsAt) : t("noAppointment")}</span></p>
                      </div>
                      <LiveBadge tone={c.top <= 1 ? "gold" : "rose"}>{pick(SEVERITY_TEXT[c.reasons[0].severity as "urgent"], locale)}</LiveBadge>
                    </div>
                    {consented ? (
                      <ul className="flex flex-col gap-2">
                        {c.reasons.map((r) => (
                          <li key={r.id} className="text-sm text-ink">• {pick(ESCALATION_TEXT[r.code as EscalationCode], locale)}{r.detail?.startsWith("callback:") ? <span className="text-gold-ink" data-callback-requested> · {t(r.detail === "callback:psychologist" ? "callbackPsychologist" : "callbackCounsellor")}</span> : r.detail ? <span className="text-muted tabular" dir="ltr"> ({r.detail})</span> : null}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="flex items-start gap-2 text-sm text-muted"><LockKey size={16} weight="light" className="mt-1 shrink-0" />{t("noAccess")}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {consented && <LinkButton href={`/counsellor/case/${c.user.id}`} iconEnd={<ArrowRight size={18} />}>{t("openBrief")}</LinkButton>}
                      {appt && !consented && <CompleteButton appointmentId={appt.id} label={t("markDone")} />}
                    </div>
                  </GlassCard>
                </li>
              );
            })}
          </ul>
        )}
      </RiseItem>
    </Rise>
  );
}
