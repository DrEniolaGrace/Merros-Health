import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { refreshEscalations } from "@/lib/services/escalation";
import { GlassCard } from "@/components/ui/glass-card";
import { Monogram } from "@/components/ui/avatar";
import { SectionTitle } from "@/components/ui/page";
import { LiveBadge } from "@/components/ui/accents";
import { PageHero } from "@/components/ui/page-hero";
import { Pill, SafetyPill } from "@/components/ui/pill";
import { Rise, RiseItem } from "@/components/ui/rise";
import { EmptyState } from "@/components/ui/states";
import { ESCALATION_TEXT, SEVERITY_TEXT } from "@/content/escalation";
import { pick } from "@/content/types";
import type { EscalationCode } from "@/lib/escalation/rules";
import { Booking } from "./booking";
import { LinkButton } from "@/components/ui/link-button";
import { decryptString } from "@/lib/crypto/fieldEncryption";
import { userDataKey } from "@/lib/crypto/keys";

const RANK: Record<string, number> = { urgent: 0, high: 1, routine: 2 };
const LANGUAGE_NAMES: Record<string, string> = { ar: "العربية", en: "English", hi: "हिन्दी", ur: "اردو", ml: "മലയാളം", fr: "Français" };

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

export default async function SupportPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ clinician?: string }> }) {
  const { locale } = await params;
  const chosenId = (await searchParams).clinician;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("support");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  await refreshEscalations(user);
  const [escalations, appointment, chosen, defaultCounsellor, summaries] = await Promise.all([
    prisma.escalation.findMany({ where: { userId: user.id, status: { in: ["open", "booked"] } } }),
    prisma.appointment.findFirst({ where: { patientId: user.id, status: "booked" }, include: { clinician: true }, orderBy: { startsAt: "asc" } }),
    chosenId ? prisma.clinician.findUnique({ where: { id: chosenId } }) : null,
    prisma.clinician.findFirst({ where: { userId: { not: null } } }),
    // Only summaries the counsellor has signed are ever shown to the person.
    prisma.patientSummary.findMany({ where: { patientId: user.id, signedAt: { not: null } }, include: { signedBy: true }, orderBy: { signedAt: "desc" } }),
  ]);
  // A booked session shows its own clinician; otherwise the one chosen in Find Care, or the genetic counsellor.
  const clinician = appointment?.clinician ?? chosen ?? defaultCounsellor;
  escalations.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const ar = locale === "ar";
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);
  const modeLabel = (m: string) => (m === "video" ? t("video") : m === "phone" ? t("phone") : t("inPerson"));

  const dayFmt = (d: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { weekday: "long", timeZone: "Asia/Dubai" }).format(d);
  const dateFmt = (d: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { day: "numeric", month: "long", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);
  const timeFmt = (d: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);
  const clinicianName = clinician ? (ar ? clinician.nameAr : clinician.nameEn) : "";

  return (
    <Rise className="flex flex-col gap-10">
      <RiseItem>
        <PageHero
          eyebrow={tp("eyebrowCare")}
          title={t("title")}
          accent={escalations.length ? t("heroAccentReasons") : t("heroAccentAlways")}
          label={{ kind: "decision_support", text: ts("decision_support") }}
          badges={appointment ? <LiveBadge tone="gold">{t("bookedBadge")}</LiveBadge> : <LiveBadge>{t("availableBadge")}</LiveBadge>}
          aside={
            clinician && (
              <div className="flex w-64 flex-col items-center gap-3 text-center">
                <span className="relative">
                  <span aria-hidden className="absolute -inset-4 animate-[spin_30s_linear_infinite] rounded-full border border-dashed border-[color-mix(in_oklab,var(--pearl-gold)_45%,transparent)]" />
                  <span aria-hidden className="absolute -inset-8 rounded-full bg-burgundy-glow/20 blur-2xl" />
                  <Monogram name={clinicianName} size={96} />
                </span>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">{t("counsellor")}</p>
                <p className="text-lg font-medium text-ink">{clinicianName}</p>
                <p className="text-sm text-muted">{ar ? clinician.credentialsAr : clinician.credentialsEn}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {clinician.languages.map((l) => (
                    <Pill key={l} tone="cyan">{LANGUAGE_NAMES[l] ?? l}</Pill>
                  ))}
                </div>
              </div>
            )
          }
        />
      </RiseItem>

      {escalations.length > 0 ? (
        <RiseItem className="flex flex-col gap-4">
          <SectionTitle>{t("why")}</SectionTitle>
          <ol className="relative flex flex-col gap-3">
            <span aria-hidden className="absolute bottom-6 start-[19px] top-6 w-px bg-[linear-gradient(var(--burgundy-glow),var(--pearl-gold))] opacity-50" />
            {escalations.map((e, i) => (
              <li key={e.id} className="relative flex gap-4">
                <span className="relative z-10 mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm text-on-burgundy shadow-[0_0_20px_-6px_var(--burgundy-glow)] tabular">
                  {i + 1}
                </span>
                <GlassCard className="corner-dots flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <p className="measure text-ink">{pick(ESCALATION_TEXT[e.code as EscalationCode], locale)}</p>
                  <LiveBadge tone={e.severity === "routine" ? "rose" : "gold"} className="shrink-0 self-start">
                    {pick(SEVERITY_TEXT[e.severity as "urgent"], locale)}
                  </LiveBadge>
                </GlassCard>
              </li>
            ))}
          </ol>
        </RiseItem>
      ) : (
        !appointment && (
          <RiseItem>
            <GlassCard><EmptyState title={t("noneTitle")} body={t("noneBody")} /></GlassCard>
          </RiseItem>
        )
      )}

      <RiseItem>
        {appointment ? (
          <GlassCard tone="gold" hero className="relative grid gap-6 overflow-hidden sm:grid-cols-[auto_1fr] sm:items-center">
            <span aria-hidden className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
            <div className="glass flex w-36 flex-col items-center gap-1 rounded-card px-4 py-5 text-center">
              <span className="text-xs uppercase tracking-[0.14em] text-gold-ink">{dayFmt(appointment.startsAt)}</span>
              <span className="font-display text-2xl font-semibold text-ink tabular">{dateFmt(appointment.startsAt)}</span>
              <span className="text-lg text-ink tabular" dir="ltr">{timeFmt(appointment.startsAt)}</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gold-ink">
                <CalendarCheck size={24} weight="light" />
                <h2 className="text-2xl font-semibold text-ink">{t("bookedTitle")}</h2>
              </div>
              <p className="text-ink">{t("bookedBody", { mode: modeLabel(appointment.mode), name: ar ? appointment.clinician.nameAr : appointment.clinician.nameEn, date: fmt(appointment.startsAt) })}</p>
              <p className="measure text-sm text-muted">{t("prepare")}</p>
              <SafetyPill kind="decision_support" label={t("simulated")} className="self-start" />
            </div>
          </GlassCard>
        ) : (
          <Booking clinicianId={clinician?.id ?? null} slots={slots().map((iso) => ({ iso, label: fmt(new Date(iso)) }))} />
        )}
      </RiseItem>

      {appointment && appointment.mode === "video" && (
        <RiseItem>
          <LinkButton href={`/session/${appointment.id}`} variant="secondary" size="lg">{t("joinVideo")}</LinkButton>
        </RiseItem>
      )}

      {summaries.length > 0 && (
        <RiseItem className="flex flex-col gap-4">
          <SectionTitle>{t("summariesTitle")}</SectionTitle>
          {summaries.map((sm) => (
            <GlassCard key={sm.id} tone="gold" className="flex flex-col gap-4" data-summary>
              <SafetyPill kind="clinical_advice" label={ts("clinical_advice")} className="self-start" />
              {decryptString(sm.encText, userDataKey(user), `summary:${user.id}`).split(/\n{2,}/).map((para, i) => (
                <p key={i} className="measure text-ink">{para}</p>
              ))}
              {sm.signedBy && (
                <div className="flex items-center gap-3 border-t border-glass-border pt-4">
                  <Monogram name={ar ? sm.signedBy.nameAr : sm.signedBy.nameEn} size={40} />
                  <p className="text-sm text-muted">
                    {t("signedBy", { name: ar ? sm.signedBy.nameAr : sm.signedBy.nameEn, date: fmt(sm.signedAt!) })}
                    <br />
                    {ar ? sm.signedBy.credentialsAr : sm.signedBy.credentialsEn} · <span dir="ltr">{sm.signedBy.licenceNo}</span>
                  </p>
                </div>
              )}
            </GlassCard>
          ))}
        </RiseItem>
      )}

      <RiseItem>
        <LinkButton href="/find-care" variant="ghost">{t("findOther")}</LinkButton>
      </RiseItem>
    </Rise>
  );
}
