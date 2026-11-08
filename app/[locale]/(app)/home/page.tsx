import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BookOpenText, Compass, Lifebuoy, Path, ShieldCheck, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOwnResult } from "@/lib/services/results";
import { refreshEscalations } from "@/lib/services/escalation";
import { isQuestionDone } from "@/lib/teachback/logic";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { SectionTitle } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/motion";
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
  const [own, attempts, openEsc, appt, events, partner] = await Promise.all([
    getOwnResult(user, { log: false }),
    prisma.teachBackAttempt.findMany({ where: { userId: user.id } }),
    prisma.escalation.count({ where: { userId: user.id, status: "open" } }),
    prisma.appointment.count({ where: { patientId: user.id, status: "booked" } }),
    prisma.pathwayEvent.findMany({ where: { userId: user.id } }),
    prisma.coupleLink.count({ where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] } }),
  ]);
  const understood = TEACHBACK.every((q) => isQuestionDone(attempts.filter((a) => a.questionId === q.questionId)));

  let next: { href: string; label: string; variant?: "primary" | "gold" } | null = null;
  if (own.status === "waiting") next = { href: "/result/import", label: t("importResult"), variant: "gold" };
  else if (own.status === "none") next = { href: "/screening", label: t("screening") };
  else if (own.status === "ok" && !understood) next = { href: "/result", label: t("openResult") };
  else if (openEsc > 0 && appt === 0) next = { href: "/support", label: t("book") };
  else if (own.status === "no_consent") next = { href: "/privacy", label: tc("continue") };

  const links = [
    { href: "/result", label: tn("result"), Icon: ArrowRight },
    ...(partner ? [{ href: "/couple", label: tn("couple"), Icon: UsersThree }] : []),
    { href: "/learn", label: tn("learn"), Icon: BookOpenText },
    { href: "/options", label: tn("options"), Icon: Compass },
    { href: "/support", label: tn("care"), Icon: Lifebuoy },
    { href: "/pathway", label: tn("pathway"), Icon: Path },
    { href: "/privacy", label: tn("privacy"), Icon: ShieldCheck },
  ];
  const name = locale === "ar" ? user.displayNameAr : user.displayNameEn;

  return (
    <Rise className="flex flex-col gap-10">
      <RiseItem>
        <GlassCard hero className="relative grid min-h-72 items-center gap-6 overflow-hidden sm:grid-cols-[1fr_auto]">
          <div className="relative z-10 flex flex-col gap-4">
            <h1 className="text-3xl font-semibold sm:text-4xl">{t("greeting", { name })}</h1>
            {next ? (
              <>
                <p className="text-sm text-gold-ink">{t("nextStep")}</p>
                <div><LinkButton href={next.href} size="lg" variant={next.variant ?? "primary"} iconEnd={<ArrowRight size={20} />}>{next.label}</LinkButton></div>
              </>
            ) : (
              <>
                <p className="text-lg text-ink">{t("allDone")}</p>
                <p className="measure text-muted">{t("allDoneBody")}</p>
              </>
            )}
          </div>
          <HelixStage className="pointer-events-none absolute -end-16 top-0 h-full w-64 opacity-80 sm:relative sm:end-0 sm:w-56" />
        </GlassCard>
      </RiseItem>

      <RiseItem className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <SectionTitle>{tn("pathway")}</SectionTitle>
          <GlassCard><PathwayTimeline compact locale={locale} events={events.map((e) => ({ step: e.step, at: e.at.toISOString() }))} /></GlassCard>
        </div>
        <div className="flex flex-col gap-4">
          <SectionTitle>{t("explore")}</SectionTitle>
          <ul className="grid grid-cols-2 gap-3">
            {links.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className="glass group flex h-20 flex-col justify-between rounded-card p-4 transition-[background,transform] duration-500 ease-calm hover:-translate-y-px hover:bg-glass-strong">
                  <Icon size={20} weight="light" className="text-rose-ink rtl:-scale-x-100" />
                  <span className="text-sm text-ink">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </RiseItem>

      <RiseItem>
        <GlassCard tone="gold" className="flex flex-col gap-2">
          <h2 className="text-sm text-gold-ink">{t("principleTitle")}</h2>
          <p className="measure text-ink">{tc("principle")}</p>
        </GlassCard>
      </RiseItem>
    </Rise>
  );
}
