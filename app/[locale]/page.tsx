import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  Fingerprint,
  Function as FunctionIcon,
  HandHeart,
  SealCheck,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { TopBar } from "@/components/chrome/top-bar";
import { HelixStage } from "@/components/three/helix-stage";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { Rise, RiseItem } from "@/components/ui/rise";
import { Eyebrow, FloatingChip, Horizon, StatRow } from "@/components/ui/accents";
import { CountUp } from "@/components/ui/motion";
import { JudgeTour } from "@/components/tour/judge-tour";
import { CoupleMatchWindow } from "@/components/landing/couple-match-window";
import { JourneyGraph } from "@/components/landing/journey-graph";
import { InheritanceExplorer } from "@/components/landing/inheritance-explorer";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const ts = await getTranslations("safety");

  const features = [
    { Icon: Fingerprint, title: t("f1Title"), body: t("f1Body") },
    { Icon: FunctionIcon, title: t("f2Title"), body: t("f2Body") },
    { Icon: HandHeart, title: t("f3Title"), body: t("f3Body") },
  ];

  return (
    <>
      <TopBar />
      <main id="main" className="flex flex-col gap-24 pb-32">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-12 sm:px-8 sm:pt-16">
          <Rise className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
            <RiseItem>
              <Eyebrow>{t("announce")}</Eyebrow>
            </RiseItem>
            <RiseItem as="h1" className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              <span className="text-gradient block">{t("heroTitle")}</span>
              <span className="text-gradient-gold block">{t("heroAccent")}</span>
            </RiseItem>
            <RiseItem as="p" className="max-w-[46ch] text-lg text-muted">
              {t("heroBody")}
            </RiseItem>
            <RiseItem className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <LinkButton href="/login" size="lg" iconEnd={<ArrowRight size={20} />}>{t("start")}</LinkButton>
              <LinkButton href="#how" size="lg" variant="secondary">{t("howItWorks")}</LinkButton>
            </RiseItem>
            <RiseItem as="p" className="flex items-center gap-2 text-sm text-muted">
              <span className="pulse-dot text-gold" aria-hidden />
              {t("status")}
            </RiseItem>
          </Rise>

          {/* Event horizon with the living helix rising through it */}
          <div className="relative mx-auto mt-4 h-[22rem] max-w-6xl sm:h-[26rem]">
            <Horizon className="bottom-0" />
            <HelixStage className="absolute inset-x-0 top-0 mx-auto h-full max-w-md" />
            {/* Floating chips beside the helix (tablet and up): real moments from a Merros journey */}
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

        {/* Stats */}
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <StatRow
            items={[
              { value: <CountUp value={25} suffix="%" locale={locale} />, label: t("stat1") },
              { value: <CountUp value={0} locale={locale} />, label: t("stat2") },
              { value: <CountUp value={100} suffix="%" locale={locale} />, label: t("stat3") },
              { value: <CountUp value={2} locale={locale} />, label: t("stat4") },
            ]}
          />
        </section>

        {/* Journey */}
        <section id="how" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-10 px-4 sm:px-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <Eyebrow>{t("journeyEyebrow")}</Eyebrow>
            <h2 className="text-gradient text-3xl font-semibold sm:text-4xl">{t("journeyTitle")}</h2>
            <p className="max-w-[52ch] text-muted">{t("journeyBody")}</p>
          </div>
          <JourneyGraph
            coreLabel={t("journeyCore")}
            nodes={[1, 2, 3, 4, 5, 6].map((i) => ({ title: t(`j${i}` as "j1"), meta: t(`j${i}m` as "j1m") }))}
          />
        </section>

        {/* Inheritance explorer */}
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <InheritanceExplorer
            locale={locale}
            ctaHref="/login"
            labels={{
              eyebrow: t("explorerEyebrow"),
              title: t("explorerTitle"),
              titleAccent: t("explorerAccent"),
              body: t("explorerBody"),
              partner1: t("partner1"),
              partner2: t("partner2"),
              carrier: t("carrier"),
              notCarrier: t("notCarrier"),
              sharedGenes: t("sharedGenes"),
              sharedHint: t("sharedHint"),
              resultEyebrow: t("resultEyebrow"),
              exact: t("exact"),
              perPregnancy: t("perPregnancy"),
              affected: t("affected"),
              carrierChild: t("carrierChild"),
              neither: t("neither"),
              perGene: t("perGene"),
              genesTile: t("genesTile"),
              combinedTile: t("combinedTile"),
              meterLabel: t("meterLabel"),
              formulaOne: t("formulaOne"),
              formulaMany: t("formulaMany"),
              formulaNone: t("formulaNone"),
              cta: t("explorerCta"),
              disclaimer: t("explorerDisclaimer"),
              education: ts("education"),
            }}
          />
        </section>

        {/* Trust */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-8">
          <div className="flex flex-col gap-4">
            <Eyebrow tone="gold">{t("featuresEyebrow")}</Eyebrow>
            <h2 className="text-gradient text-3xl font-semibold">{t("featuresTitle")}</h2>
          </div>
          <Rise className="grid gap-4 md:grid-cols-3">
            {features.map(({ Icon, title, body }) => (
              <RiseItem key={title}>
                <GlassCard tilt className="corner-dots flex h-full flex-col gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-glass-strong text-rose-ink shadow-[0_0_30px_-10px_var(--burgundy-glow)]">
                    <Icon size={24} weight="light" />
                  </span>
                  <h3 className="text-lg font-medium">{title}</h3>
                  <p className="text-sm text-muted">{body}</p>
                </GlassCard>
              </RiseItem>
            ))}
          </Rise>
          <GlassCard tone="gold" hero>
            <p className="measure text-lg text-ink">{tc("principle")}</p>
          </GlassCard>
        </section>
      </main>
      <JudgeTour />
    </>
  );
}
