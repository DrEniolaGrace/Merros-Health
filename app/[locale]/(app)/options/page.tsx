import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Flask, HandHeart, Handshake, House, Leaf, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { ActionDock, PageHeader } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";
import { Disclosure } from "@/components/ui/disclosure";
import { OPTIONS, seededShuffle, type OptionCard } from "@/content/options";
import { pick } from "@/content/types";

const ICONS: Record<OptionCard["icon"], typeof House> = {
  house: House, stethoscope: Stethoscope, flask: Flask, handshake: Handshake, heart: HandHeart, leaf: Leaf, clock: Clock,
};

export default async function OptionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("options");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");
  const ordered = seededShuffle(OPTIONS, user.profile?.presentationSeed ?? 1);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={tp("eyebrowOptions")} title={t("title")} body={t("body")} label={{ kind: "decision_support", text: ts("decision_support") }} />
      <Rise as="ul" className="grid gap-4 md:grid-cols-2">
        {ordered.map((o) => {
          const Icon = ICONS[o.icon];
          return (
            <RiseItem as="li" key={o.optionId} className="h-full">
              <GlassCard tilt className="flex h-full flex-col gap-0 p-0" data-option={o.optionId}>
                <div className="flex flex-col gap-3 p-6 pb-4">
                  <Icon size={28} weight="light" className="text-rose-ink" />
                  <h2 className="text-lg font-medium">{pick(o.title, locale)}</h2>
                  <p className="text-sm text-muted">{pick(o.involves, locale)}</p>
                </div>
                <div className="mt-auto border-t border-glass-border">
                  <Disclosure title={tc("learnMore")}>
                    <dl className="flex flex-col gap-4 text-sm">
                      {(
                        [
                          [t("timing"), o.timing],
                          [t("cost"), o.cost],
                          [t("availability"), o.availability],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-muted">{k}</dt>
                          <dd className="text-ink">{pick(v, locale)}</dd>
                        </div>
                      ))}
                      <div>
                        <dt className="text-muted">{t("questions")}</dt>
                        <dd>
                          <ul className="list-disc ps-5 text-ink">
                            {o.questions.map((q) => <li key={q.en}>{pick(q, locale)}</li>)}
                          </ul>
                        </dd>
                      </div>
                    </dl>
                  </Disclosure>
                </div>
              </GlassCard>
            </RiseItem>
          );
        })}
      </Rise>
      <p className="measure text-sm text-muted">{t("values")} · {tc("pendingReview")}</p>
      <ActionDock>
        <LinkButton href="/support" size="lg">{t("talk")}</LinkButton>
      </ActionDock>
    </div>
  );
}
