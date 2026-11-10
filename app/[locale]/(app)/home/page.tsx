import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  BookOpenText,
  CalendarCheck,
  CheckCircle,
  Compass,
  Dna,
  Hourglass,
  Lifebuoy,
  LockKey,
  Path,
  SealCheck,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOwnResult } from "@/lib/services/results";
import { refreshEscalations } from "@/lib/services/escalation";
import { comprehensionScores, isQuestionDone } from "@/lib/teachback/logic";
import { isConsentActive } from "@/lib/consent/check";
import { summarisePerson } from "@/lib/risk/engine";
import { PATHWAY_STEPS, furthestStep } from "@/lib/pathway/steps";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { SectionTitle } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";
import { CountUp } from "@/components/ui/motion";
import { Eyebrow, FloatingChip, Horizon, StatRow } from "@/components/ui/accents";
import { HelixStage } from "@/components/three/helix-stage";
import { PathwayTimeline } from "@/components/pathway/timeline";
import { Link, redirect } from "@/i18n/navigation";
import { TEACHBACK } from "@/content/teachback";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  if (!user.profile?.onboardedAt) redirect({ href: "/onboarding", locale });
  const t = await getTranslations("home");
  const tn = await getTranslations("nav");
  const tc = await getTranslations("common");

  await refreshEscalations(user);
  const now = new Date();
  const [own, attempts, openEsc, appts, events, partner, consents] = await Promise.all([
    getOwnResult(user, { log: false }),
    prisma.teachBackAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.escalation.count({ where: { userId: user.id, status: "open" } }),
    prisma.appointment.findMany({ where: { patientId: user.id, status: "booked" }, orderBy: { startsAt: "asc" } }),
    prisma.pathwayEvent.findMany({ where: { userId: user.id } }),
    prisma.coupleLink.count({ where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] } }),
    prisma.consent.findMany({ where: { userId: user.id } }),
  ]);
  const understood = TEACHBACK.every((q) => isQuestionDone(attempts.filter((a) => a.questionId === q.questionId)));
  const scores = comprehensionScores(TEACHBACK.map((q) => q.questionId), attempts);
  const activeConsents = consents.filter((c) => isConsentActive(c, now));
  const coupleOn = activeConsents.some((c) => c.purpose === "couple_comparison");
  const carrierGenes = own.status === "ok" ? summarisePerson(own.result.variants).genes.length : null;
  const stepsDone = events.length;
  const currentStep = Math.min(furthestStep(events.map((e) => e.step)) + 2, PATHWAY_STEPS.length);

  let next: { href: string; label: string; variant?: "primary" | "gold" } | null = null;
  if (own.status === "waiting") next = { href: "/import", label: t("importResult"), variant: "gold" };
  else if (own.status === "none") next = { href: "/screening", label: t("screening") };
  else if (own.status === "ok" && !understood) next = { href: "/result", label: t("openResult") };
  else if (openEsc > 0 && appts.length === 0) next = { href: "/support", label: t("book") };
  else if (own.status === "no_consent") next = { href: "/privacy", label: tc("continue") };

  const chips: { icon: React.ReactNode; title: string; tone?: "gold" | "cyan" }[] = [];
  if (own.status === "ok") chips.push({ icon: <SealCheck size={16} />, title: t("chipVerified"), tone: "cyan" });
  if (own.status === "waiting") chips.push({ icon: <Hourglass size={16} />, title: t("chipWaiting"), tone: "gold" });
  if (own.status === "no_consent") chips.push({ icon: <LockKey size={16} />, title: t("chipSealed") });
  if (understood) chips.push({ icon: <CheckCircle size={16} />, title: t("chipUnderstood") });
  if (coupleOn) chips.push({ icon: <UsersThree size={16} />, title: t("chipCouple") });
  if (appts.length) chips.push({ icon: <CalendarCheck size={16} />, title: t("chipBooked"), tone: "gold" });

  const links = [
    { href: "/result", label: tn("result"), Icon: Dna },
    ...(partner ? [{ href: "/couple", label: tn("couple"), Icon: UsersThree }] : []),
    { href: "/learn", label: tn("learn"), Icon: BookOpenText },
    { href: "/options", label: tn("options"), Icon: Compass },
    { href: "/support", label: tn("care"), Icon: Lifebuoy },
    { href: "/pathway", label: tn("pathway"), Icon: Path },
    { href: "/privacy", label: tn("privacy"), Icon: ShieldCheck },
  ];
  const name = locale === "ar" ? user.displayNameAr : user.displayNameEn;

  return (
    <Rise className="flex flex-col gap-12">
      {/* Hero */}
      <RiseItem>
        <section className="glass relative isolate overflow-hidden rounded-hero px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
          <Horizon className="-bottom-24 opacity-80 sm:-bottom-40" />
          <HelixStage className="pointer-events-none absolute -end-16 -top-6 h-[120%] w-56 opacity-35 sm:end-4 sm:w-72 sm:opacity-70" />
          <div className="relative z-10 flex flex-col gap-5">
            <div>
              <Eyebrow tone="gold">{t("eyebrowStep", { n: currentStep, total: PATHWAY_STEPS.length })}</Eyebrow>
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              <span className="text-gradient block">{t("greeting", { name })}</span>
              <span className="text-gradient-gold block text-3xl sm:text-4xl">{next ? t("heroAccent") : t("allDone")}</span>
            </h1>
            {next ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">{t("nextStep")}</p>
                <div>
                  <LinkButton href={next.href} size="lg" variant={next.variant ?? "primary"} iconEnd={<ArrowRight size={20} />}>
                    {next.label}
                  </LinkButton>
                </div>
              </div>
            ) : (
              <p className="measure text-muted">{t("allDoneBody")}</p>
            )}
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-2">
                {chips.map((c, i) => (
                  <li key={c.title} className={i % 2 ? "float-slower" : "float-slow"}>
                    <FloatingChip icon={c.icon} title={c.title} tone={c.tone} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </RiseItem>

      {/* Your numbers */}
      <RiseItem>
        <StatRow
          items={[
            { value: <><CountUp value={stepsDone} locale={locale} /><span className="text-muted">/{PATHWAY_STEPS.length}</span></>, label: t("statSteps") },
            { value: scores.answered ? <CountUp value={Math.round(scores.after * 100)} suffix="%" locale={locale} /> : t("notYet"), label: t("statUnderstanding") },
            { value: <CountUp value={activeConsents.length} locale={locale} />, label: t("statConsents") },
            { value: carrierGenes === null ? t("notYet") : <CountUp value={carrierGenes} locale={locale} />, label: t("statCarrier") },
          ]}
        />
      </RiseItem>

      <RiseItem className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <SectionTitle>{tn("pathway")}</SectionTitle>
          <GlassCard className="corner-dots">
            <PathwayTimeline compact locale={locale} events={events.map((e) => ({ step: e.step, at: e.at.toISOString() }))} />
          </GlassCard>
        </div>
        <div className="flex flex-col gap-4">
          <SectionTitle>{t("explore")}</SectionTitle>
          <ul className="grid grid-cols-2 gap-3">
            {links.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="glass corner-dots group relative flex h-24 flex-col justify-between overflow-hidden rounded-card p-4 transition-[background,transform,box-shadow] duration-500 ease-calm hover:-translate-y-0.5 hover:bg-glass-strong hover:shadow-[0_18px_40px_-24px_var(--burgundy-glow)]"
                >
                  <span aria-hidden className="pointer-events-none absolute -end-8 -top-8 h-20 w-20 rounded-full bg-burgundy-glow/0 blur-2xl transition-colors duration-700 group-hover:bg-burgundy-glow/30" />
                  <Icon size={22} weight="light" className="text-rose-ink" />
                  <span className="flex items-center justify-between gap-2 text-sm text-ink">
                    {label}
                    <ArrowRight size={14} className="text-muted transition-transform duration-500 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </RiseItem>

      <RiseItem>
        <GlassCard tone="gold" className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-[0.14em] text-gold-ink">{t("principleTitle")}</h2>
          <p className="measure text-ink">{tc("principle")}</p>
        </GlassCard>
      </RiseItem>
    </Rise>
  );
}
