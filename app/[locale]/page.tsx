import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowsClockwise,
  BookOpenText,
  CalendarCheck,
  ChartLineUp,
  CheckCircle,
  Dna,
  FunctionIcon,
  HandHeart,
  Key,
  SealCheck,
  ShieldCheck,
  Signature,
  Stethoscope,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { TopBar } from "@/components/chrome/top-bar";
import { HelixStage } from "@/components/three/helix-stage";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { Rise, RiseItem } from "@/components/ui/rise";
import { Eyebrow, FloatingChip, Horizon } from "@/components/ui/accents";
import { JudgeTour } from "@/components/tour/judge-tour";
import { SiteFooter } from "@/components/chrome/site-footer";
import { CoupleMatchWindow } from "@/components/landing/couple-match-window";
import { StartTour } from "@/components/landing/start-tour";
import { ArabicChat, MatchOrbs, ReclassifiedPill, SignalsSpark } from "@/components/landing/feature-visuals";
import { RevealOnScroll } from "@/components/ui/reveal";

/**
 * The home page. The hero is the original Merros landing design (restored from commit 7f48137:
 * the living helix rising through the event horizon, floating chips and the couple match window);
 * the sections below tell the story calmly, each revealed gently as it scrolls into view.
 */
export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const steps = [
    { Icon: BookOpenText, k: "how1" },
    { Icon: Key, k: "how2" },
    { Icon: Stethoscope, k: "how3" },
    { Icon: ArrowsClockwise, k: "how4" },
  ] as const;
  const people = [
    { Icon: HandHeart, k: "forFamilies" },
    { Icon: UsersThree, k: "forCounsellors" },
    { Icon: ChartLineUp, k: "forSystem" },
  ] as const;
  const responsible = [
    { Icon: FunctionIcon, k: "resp1" },
    { Icon: Signature, k: "resp2" },
    { Icon: ShieldCheck, k: "resp3" },
    { Icon: Dna, k: "resp4" },
  ] as const;

  const heading = (eyebrow: string, title: string, body?: string) => (
    <div className="reveal mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-gradient text-3xl font-semibold sm:text-4xl">{title}</h2>
      {body && <p className="max-w-[52ch] text-muted">{body}</p>}
    </div>
  );

  return (
    <>
      <TopBar />
      <RevealOnScroll />
      <main id="main" className="flex flex-col gap-28 pb-24 sm:gap-36">
        {/* a. Hero: the original design */}
        <section className="relative overflow-hidden px-4 pt-12 sm:px-8 sm:pt-16">
          <Rise className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
            <RiseItem as="h1" className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              <span className="text-gradient block">{t("homeTitle")}</span>
              <span className="text-gradient-gold block">{t("homeAccent")}</span>
            </RiseItem>
            <RiseItem as="p" className="max-w-[50ch] text-lg text-muted">
              {t("summary")}
            </RiseItem>
            <RiseItem className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              <StartTour label={t("startTour")} />
              <LinkButton href="/login" size="lg" variant="secondary">{t("explore")}</LinkButton>
            </RiseItem>
          </Rise>

          {/* Event horizon with the living helix rising through it */}
          <div className="relative mx-auto mt-4 h-[22rem] max-w-6xl sm:h-[26rem]">
            <Horizon className="bottom-0" />
            <HelixStage className="absolute inset-x-0 top-0 mx-auto h-full max-w-md" />
            <div aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden md:block">
              <FloatingChip className="float-slow absolute start-0 top-10 lg:start-8" icon={<SealCheck size={16} />} title={t("chipSigned")} meta={t("chipSignedMeta")} tone="cyan" />
              <FloatingChip className="float-slower absolute start-6 top-40 lg:start-24" icon={<ShieldCheck size={16} />} title={t("chipConsent")} meta={t("chipConsentMeta")} />
              <FloatingChip className="float-slower absolute end-0 top-16 lg:end-8" icon={<CheckCircle size={16} />} title={t("chipTeach")} meta={t("chipTeachMeta")} />
              <FloatingChip className="float-slow absolute end-6 top-48 lg:end-24" icon={<CalendarCheck size={16} />} title={t("chipCounsellor")} meta={t("chipCounsellorMeta")} tone="gold" />
            </div>
          </div>
          <div className="relative z-10 mx-auto -mt-32 max-w-3xl sm:-mt-36">
            <CoupleMatchWindow
              labels={{
                title: t("matchTitle"),
                partnerA: t("partnerA"),
                partnerB: t("partnerB"),
                sealed: t("sealed"),
                keyTurned: t("keyTurned"),
                matching: t("matching"),
                matched: t("matched"),
                shared: t("shared"),
                stillSealed: t("stillSealed"),
                note: t("matchNote"),
                illustration: t("illustration"),
              }}
            />
          </div>
        </section>

        {/* b. How Merros works */}
        <section id="how" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-10 px-4 sm:px-8">
          {heading(t("howEyebrow"), t("howTitle"))}
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ Icon, k }, i) => (
              <li key={k} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <GlassCard className="flex h-full flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-glass-strong text-rose-ink shadow-[0_0_30px_-10px_var(--burgundy-glow)]">
                      <Icon size={22} weight="light" />
                    </span>
                    <span className="text-xs font-medium text-gold-ink tabular">0{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-medium text-ink">{t(`${k}Title`)}</h3>
                  <p className="text-sm text-muted">{t(`${k}Body`)}</p>
                </GlassCard>
              </li>
            ))}
          </ol>
        </section>

        {/* c. One platform, three people */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-8">
          {heading(t("peopleEyebrow"), t("peopleTitle"))}
          <div className="grid gap-4 md:grid-cols-3">
            {people.map(({ Icon, k }, i) => (
              <div key={k} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <GlassCard tilt className="corner-dots flex h-full flex-col gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-glass-strong text-rose-ink shadow-[0_0_30px_-10px_var(--burgundy-glow)]">
                    <Icon size={24} weight="light" />
                  </span>
                  <h3 className="text-lg font-medium text-ink">{t(`${k}Title`)}</h3>
                  <p className="text-sm text-muted">{t(`${k}Body`)}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </section>

        {/* d. What makes Merros different */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-8">
          {heading(t("diffEyebrow"), t("diffTitle"))}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { k: "diffMatch", visual: <MatchOrbs shared="HBB" /> },
              { k: "diffLiving", visual: <ReclassifiedPill from={t("diffLivingFrom")} to={t("diffLivingTo")} note={t("diffLivingNote")} /> },
              { k: "diffCopilot", visual: <ArabicChat question={t("diffCopilotQ")} answer={t("diffCopilotA")} /> },
              { k: "diffSignals", visual: <SignalsSpark /> },
            ].map(({ k, visual }, i) => (
              <div key={k} className="reveal" style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
                <GlassCard className="flex h-full flex-col gap-4">
                  <div className="rounded-control border border-glass-border bg-[color-mix(in_oklab,var(--bg-raised)_60%,transparent)] px-4">{visual}</div>
                  <h3 className="text-lg font-medium text-ink">{t(`${k}Title`)}</h3>
                  <p className="text-sm text-muted">{t(`${k}Body`)}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </section>

        {/* e. Built responsibly */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-8">
          {heading(t("respEyebrow"), t("respTitle"))}
          <ul className="grid gap-3 sm:grid-cols-2">
            {responsible.map(({ Icon, k }, i) => (
              <li key={k} className="reveal glass flex items-center gap-4 rounded-card p-5" style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pearl-gold)_18%,transparent)] text-gold-ink">
                  <Icon size={22} weight="light" />
                </span>
                <span className="text-ink">{t(k)}</span>
              </li>
            ))}
          </ul>
          <div className="reveal">
            <GlassCard tone="gold" hero>
              <p className="measure text-lg text-ink">{tc("principle")}</p>
            </GlassCard>
          </div>
        </section>

        {/* f. Evidence */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-8" data-evidence>
          {heading(t("evidenceEyebrow"), t("evidenceTitle"))}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="reveal">
              <GlassCard hero className="flex h-full flex-col gap-3 text-center">
                <p className="text-gradient-gold font-display text-5xl font-semibold tracking-tight tabular" dir="ltr">8 → 12</p>
                <p className="text-lg text-ink">{t("evidence1")}</p>
              </GlassCard>
            </div>
            <div className="reveal" style={{ transitionDelay: "80ms" }}>
              <GlassCard hero className="flex h-full flex-col gap-3 text-center">
                <p className="text-gradient-gold font-display text-5xl font-semibold tracking-tight tabular" dir="ltr">12 / 12</p>
                <p className="text-lg text-ink">{t("evidence2")}</p>
              </GlassCard>
            </div>
          </div>
          <p className="reveal mx-auto max-w-[60ch] text-center text-xs text-muted">{t("evidenceNote")}</p>
        </section>

        {/* g. Closing */}
        <section className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 overflow-hidden px-4 py-10 text-center sm:px-8">
          <div className="reveal flex flex-col items-center gap-6">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              <span className="text-gradient block">{t("homeTitle")}</span>
              <span className="text-gradient-gold block">{t("homeAccent")}</span>
            </h2>
            <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              <StartTour label={t("startTour")} />
              <LinkButton href="/login" size="lg" variant="secondary">{t("explore")}</LinkButton>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      {/* The page has its own tour buttons; the tour card still appears here once a tour runs. */}
      <JudgeTour floating={false} />
    </>
  );
}
