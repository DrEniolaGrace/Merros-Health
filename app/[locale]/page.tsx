import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Fingerprint, Function as FunctionIcon, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { TopBar } from "@/components/chrome/top-bar";
import { HelixStage } from "@/components/three/helix-stage";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { Rise, RiseItem } from "@/components/ui/rise";
import { JudgeTour } from "@/components/tour/judge-tour";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const features = [
    { Icon: Fingerprint, title: t("f1Title"), body: t("f1Body") },
    { Icon: FunctionIcon, title: t("f2Title"), body: t("f2Body") },
    { Icon: HandHeart, title: t("f3Title"), body: t("f3Body") },
  ];

  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-32 pt-8 sm:px-8">
        <section className="relative grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <Rise className="relative z-10 flex flex-col gap-6">
            <RiseItem as="p" className="text-sm text-gold-ink">{t("eyebrow")}</RiseItem>
            <RiseItem as="h1" className="text-4xl font-semibold leading-tight sm:text-5xl">{t("title")}</RiseItem>
            <RiseItem as="p" className="measure text-lg text-muted">{t("body")}</RiseItem>
            <RiseItem className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/login" size="lg" iconEnd={<ArrowRight size={20} />}>{t("start")}</LinkButton>
              <LinkButton href="/design-system" size="lg" variant="ghost">{t("design")}</LinkButton>
            </RiseItem>
          </Rise>
          <HelixStage className="-mt-8 h-80 md:mt-0 md:h-[32rem]" />
        </section>

        <Rise as="section" className="grid gap-4 md:grid-cols-3" delay={0.3}>
          {features.map(({ Icon, title, body }) => (
            <RiseItem key={title}>
              <GlassCard tilt className="flex h-full flex-col gap-3">
                <Icon size={28} weight="light" className="text-rose-ink" />
                <h2 className="text-lg font-medium">{title}</h2>
                <p className="text-sm text-muted">{body}</p>
              </GlassCard>
            </RiseItem>
          ))}
        </Rise>

        <GlassCard tone="gold" hero className="flex flex-col gap-3">
          <p className="measure text-lg text-ink">{tc("principle")}</p>
        </GlassCard>
      </main>
      <JudgeTour />
    </>
  );
}
