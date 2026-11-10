import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { refreshEscalations } from "@/lib/services/escalation";
import { GlassCard } from "@/components/ui/glass-card";
import { Monogram } from "@/components/ui/avatar";
import { PageHeader, SectionTitle } from "@/components/ui/page";
import { Pill, SafetyPill } from "@/components/ui/pill";
import { Rise, RiseItem } from "@/components/ui/rise";
import { EmptyState } from "@/components/ui/states";
import { ESCALATION_TEXT, SEVERITY_TEXT } from "@/content/escalation";
import { pick } from "@/content/types";
import type { EscalationCode } from "@/lib/escalation/rules";
import { Booking } from "./booking";

const RANK: Record<string, number> = { urgent: 0, high: 1, routine: 2 };

/** Next three weekday slots at 10:00 and 15:30 local time (synthetic). */
function slots(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (out.length < 4) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    for (const [h, m] of [[6, 0], [11, 30]]) {
      if (out.length < 4) out.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m)).toISOString());
    }
  }
  return out;
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("support");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  await refreshEscalations(user);
  const [escalations, appointment, clinician] = await Promise.all([
    prisma.escalation.findMany({ where: { userId: user.id, status: { not: "resolved" } } }),
    prisma.appointment.findFirst({ where: { patientId: user.id, status: "booked" }, include: { clinician: true }, orderBy: { startsAt: "asc" } }),
    prisma.clinician.findFirst(),
  ]);
  escalations.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const ar = locale === "ar";
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);
  const modeLabel = (m: string) => (m === "video" ? t("video") : m === "phone" ? t("phone") : t("inPerson"));

  return (
    <Rise className="flex flex-col gap-8">
      <RiseItem>
        <PageHeader eyebrow={tp("eyebrowCare")} title={t("title")} label={{ kind: "decision_support", text: ts("decision_support") }} />
      </RiseItem>

      {escalations.length > 0 ? (
        <RiseItem className="flex flex-col gap-3">
          <SectionTitle>{t("why")}</SectionTitle>
          <ul className="flex flex-col gap-3">
            {escalations.map((e) => (
              <li key={e.id}>
                <GlassCard className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <p className="measure text-ink">{pick(ESCALATION_TEXT[e.code as EscalationCode], locale)}</p>
                  <Pill tone={e.severity === "routine" ? "neutral" : "gold"} className="shrink-0 self-start">{pick(SEVERITY_TEXT[e.severity as "urgent"], locale)}</Pill>
                </GlassCard>
              </li>
            ))}
          </ul>
        </RiseItem>
      ) : (
        !appointment && (
          <RiseItem>
            <GlassCard><EmptyState title={t("noneTitle")} body={t("noneBody")} /></GlassCard>
          </RiseItem>
        )
      )}

      {clinician && (
        <RiseItem>
          <GlassCard className="flex items-center gap-4">
            <Monogram name={ar ? clinician.nameAr : clinician.nameEn} size={56} />
            <div className="min-w-0">
              <p className="text-sm text-muted">{t("counsellor")}</p>
              <p className="text-lg font-medium">{ar ? clinician.nameAr : clinician.nameEn}</p>
              <p className="text-sm text-muted">{ar ? clinician.credentialsAr : clinician.credentialsEn}</p>
            </div>
          </GlassCard>
        </RiseItem>
      )}

      <RiseItem>
        {appointment ? (
          <GlassCard tone="gold" hero className="flex flex-col gap-3">
            <CalendarCheck size={32} weight="light" className="text-gold-ink" />
            <h2 className="text-2xl font-semibold">{t("bookedTitle")}</h2>
            <p className="text-ink">{t("bookedBody", { mode: modeLabel(appointment.mode), name: ar ? appointment.clinician.nameAr : appointment.clinician.nameEn, date: fmt(appointment.startsAt) })}</p>
            <p className="measure text-sm text-muted">{t("prepare")}</p>
            <SafetyPill kind="decision_support" label={t("simulated")} className="self-start" />
          </GlassCard>
        ) : (
          <Booking slots={slots().map((iso) => ({ iso, label: fmt(new Date(iso)) }))} />
        )}
      </RiseItem>
    </Rise>
  );
}
