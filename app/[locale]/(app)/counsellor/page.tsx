import { getTranslations, setRequestLocale } from "next-intl/server";
import { LockKey } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hasActiveConsent } from "@/lib/consent/check";
import { getOwnResult } from "@/lib/services/results";
import { summarisePerson } from "@/lib/risk/engine";
import { appendAudit } from "@/lib/audit/log";
import { GlassCard } from "@/components/ui/glass-card";
import { Monogram } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page";
import { Pill } from "@/components/ui/pill";
import { Rise, RiseItem } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/states";
import { ESCALATION_TEXT, SEVERITY_TEXT } from "@/content/escalation";
import { pick } from "@/content/types";
import type { EscalationCode } from "@/lib/escalation/rules";
import { CompleteButton } from "./complete-button";

const RANK: Record<string, number> = { urgent: 0, high: 1, routine: 2 };

export default async function CounsellorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireUser(["counsellor"]);
  const t = await getTranslations("counsellor");
  const ar = locale === "ar";

  const escalations = await prisma.escalation.findMany({
    where: { status: { in: ["open", "booked"] } },
    include: { user: { include: { consents: true, appointments: { where: { status: "booked" }, orderBy: { startsAt: "asc" } } } } },
  });
  const byUser = new Map<string, typeof escalations>();
  for (const e of escalations) byUser.set(e.userId, [...(byUser.get(e.userId) ?? []), e]);
  const cases = [...byUser.values()]
    .map((es) => ({ user: es[0].user, reasons: es.sort((a, b) => RANK[a.severity] - RANK[b.severity]), top: Math.min(...es.map((e) => RANK[e.severity])) }))
    .sort((a, b) => a.top - b.top || +a.reasons[0].createdAt - +b.reasons[0].createdAt);

  const fmt = (d: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);

  const details = await Promise.all(
    cases.map(async (c) => {
      if (!hasActiveConsent(c.user.consents, "counsellor_access")) return null;
      const own = await getOwnResult(c.user, { log: false });
      await appendAudit({ actorId: me.id, subjectId: c.user.id, action: "case_viewed", resource: "counsellor_queue" });
      return own.status === "ok" ? summarisePerson(own.result.variants) : { genes: [], vus: [] };
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} body={t("body")} />
      {cases.length === 0 ? (
        <GlassCard><EmptyState title={t("emptyTitle")} body={t("emptyBody")} /></GlassCard>
      ) : (
        <Rise as="ul" className="flex flex-col gap-4">
          {cases.map((c, i) => {
            const d = details[i];
            const appt = c.user.appointments[0];
            return (
              <RiseItem as="li" key={c.user.id}>
                <GlassCard tone={c.top === 0 ? "gold" : "default"} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Monogram name={ar ? c.user.displayNameAr : c.user.displayNameEn} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-medium">{ar ? c.user.displayNameAr : c.user.displayNameEn}</p>
                      <p className="text-sm text-muted">{t("appointment")}: <span className="tabular">{appt ? fmt(appt.startsAt) : t("noAppointment")}</span></p>
                    </div>
                    <Pill tone={c.top <= 1 ? "gold" : "neutral"}>{pick(SEVERITY_TEXT[c.reasons[0].severity as "urgent"], locale)}</Pill>
                  </div>
                  {d && <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted">{t("reasons")}</p>
                    <ul className="flex flex-col gap-2">
                      {c.reasons.map((r) => (
                        <li key={r.id} className="text-sm text-ink">• {pick(ESCALATION_TEXT[r.code as EscalationCode], locale)}{d && r.detail ? <span className="text-muted tabular" dir="ltr"> ({r.detail})</span> : null}</li>
                      ))}
                    </ul>
                  </div>}
                  {d ? (
                    <div className="flex flex-wrap gap-2" dir="ltr">
                      {d.genes.map((g) => <Pill key={g.gene} tone="cyan">{t("carrierGenes")}: {g.gene}</Pill>)}
                      {d.vus.map((v) => <Pill key={v.hgvs}>{t("vus")}: {v.gene}</Pill>)}
                    </div>
                  ) : (
                    <p className="flex items-start gap-2 text-sm text-muted"><LockKey size={16} weight="light" className="mt-1 shrink-0" />{t("noAccess")}</p>
                  )}
                  {appt && <CompleteButton appointmentId={appt.id} label={t("markDone")} />}
                </GlassCard>
              </RiseItem>
            );
          })}
        </Rise>
      )}
      <p className="text-sm text-muted">{t("briefNote")}</p>
    </div>
  );
}
