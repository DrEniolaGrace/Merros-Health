import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChartLineUp, Dna, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { TopBar } from "@/components/chrome/top-bar";
import { HelixStage } from "@/components/three/helix-stage";
import { LinkButton } from "@/components/ui/link-button";
import { Rise, RiseItem } from "@/components/ui/rise";
import { Horizon } from "@/components/ui/accents";
import { JudgeTour } from "@/components/tour/judge-tour";
import { SiteFooter } from "@/components/chrome/site-footer";
import { StartTour } from "@/components/landing/start-tour";

/** The front door: who Merros is for, one line on what it does, and two ways in. */
export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  const proof = [
    { Icon: ChartLineUp, text: t("proofUnderstanding") },
    { Icon: Dna, text: t("proofPanel") },
    { Icon: ShieldCheck, text: t("proofPrivacy") },
  ];

  return (
    <>
      <TopBar />
      <main id="main" className="flex flex-col pb-20">
        <section className="relative overflow-hidden px-4 pt-10 sm:px-8 sm:pt-14">
          <Rise className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <RiseItem as="h1" className="flex flex-col gap-2">
              <span className="text-gradient text-5xl font-semibold tracking-tight sm:text-7xl">{t("name")}</span>
              <span className="text-gradient-gold text-2xl font-medium leading-tight sm:text-4xl">{t("tagline")}</span>
            </RiseItem>
            <RiseItem as="p" className="max-w-[52ch] text-base text-muted sm:text-lg">
              {t("summary")}
            </RiseItem>
            <RiseItem className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              <StartTour label={t("startTour")} />
              <LinkButton href="/login" size="lg" variant="secondary">{t("explore")}</LinkButton>
            </RiseItem>
          </Rise>

          {/* The living helix rising through the event horizon */}
          <div className="relative mx-auto mt-2 h-[17rem] max-w-5xl sm:h-[22rem]">
            <Horizon className="bottom-0" />
            <HelixStage className="absolute inset-x-0 top-0 mx-auto h-full max-w-sm" />
          </div>

          <ul className="relative z-10 mx-auto -mt-10 grid max-w-4xl gap-3 sm:-mt-14 sm:grid-cols-3" data-proof>
            {proof.map(({ Icon, text }) => (
              <li key={text} className="glass flex items-center gap-3 rounded-card p-4 text-start text-sm text-ink">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--burgundy)_55%,transparent)] text-rose-ink">
                  <Icon size={20} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
      <JudgeTour />
    </>
  );
}
