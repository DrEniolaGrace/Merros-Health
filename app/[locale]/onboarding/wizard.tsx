"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpenText, Headphones, LockKey, Translate } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ChoiceGroup, Steps, Switch } from "@/components/ui/controls";
import { usePathname, useRouter } from "@/i18n/navigation";
import { saveOnboarding } from "@/lib/actions/patient";
import type { ConsentPurpose } from "@/lib/consent/purposes";

type Level = "simple" | "standard" | "detailed";
type Media = "text" | "audio" | "both";
type Preg = "none" | "trying" | "pregnant" | "prefer_not_to_say";

const TOTAL = 5;

export function Wizard({
  initialStep,
  locale,
  purposes,
  defaults,
}: {
  initialStep: number;
  locale: "ar" | "en";
  purposes: { purpose: ConsentPurpose; title: string; body: string; gold: boolean }[];
  defaults: { readingLevel: Level; mediaPref: Media; pregnancyStatus: Preg };
}) {
  const t = useTranslations("onboarding");
  const tds = useTranslations("ds");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState(initialStep);
  const [level, setLevel] = useState<Level>(defaults.readingLevel);
  const [media, setMedia] = useState<Media>(defaults.mediaPref);
  const [preg, setPreg] = useState<Preg>(defaults.pregnancyStatus);
  const [consents, setConsents] = useState<Set<ConsentPurpose>>(new Set());
  const [pending, start] = useTransition();

  function chooseLanguage(l: "ar" | "en") {
    // Switching language reloads the page in that language and continues at step 2.
    if (l === locale) setStep(2);
    else router.replace({ pathname, query: { step: "2" } }, { locale: l });
  }

  function toggle(p: ConsentPurpose, on: boolean) {
    setConsents((prev) => {
      const next = new Set(prev);
      if (on) next.add(p);
      else next.delete(p);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gold-ink tabular">{t("step", { n: step, total: TOTAL })}</p>
        <Steps total={TOTAL} current={step} label={t("progress")} />
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassCard className="flex flex-col gap-6">
            {step === 1 && (
              <>
                <ChoiceGroup
                  legend={t("langTitle")}
                  value={locale}
                  onChange={chooseLanguage}
                  options={[
                    { value: "ar", label: "العربية", description: "Arabic", lang: "ar", icon: <Translate /> },
                    { value: "en", label: "English", description: "الإنجليزية", lang: "en", icon: <Translate /> },
                  ]}
                />
                <p className="text-sm text-muted">{t("langBody")}</p>
              </>
            )}
            {step === 2 && (
              <ChoiceGroup
                legend={t("levelTitle")}
                value={level}
                onChange={setLevel}
                options={[
                  { value: "simple", label: tds("simple"), description: tds("simpleDesc") },
                  { value: "standard", label: tds("standard"), description: tds("standardDesc") },
                  { value: "detailed", label: tds("detailed"), description: tds("detailedDesc") },
                ]}
              />
            )}
            {step === 3 && (
              <ChoiceGroup
                legend={t("mediaTitle")}
                value={media}
                onChange={setMedia}
                options={[
                  { value: "text", label: t("text"), description: t("textDesc"), icon: <BookOpenText /> },
                  { value: "audio", label: t("audio"), description: t("audioDesc"), icon: <Headphones /> },
                  { value: "both", label: t("both"), description: t("bothDesc"), icon: <Headphones /> },
                ]}
              />
            )}
            {step === 4 && (
              <>
                <ChoiceGroup
                  legend={t("aboutTitle")}
                  value={preg}
                  onChange={setPreg}
                  options={[
                    { value: "none", label: t("none") },
                    { value: "trying", label: t("trying") },
                    { value: "pregnant", label: t("pregnant") },
                    { value: "prefer_not_to_say", label: t("preferNot") },
                  ]}
                />
                <p className="text-sm text-muted">{t("aboutBody")}</p>
              </>
            )}
            {step === 5 && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-medium">{t("consentTitle")}</h2>
                  <p className="text-sm text-muted">{t("consentBody")}</p>
                </div>
                <div className="flex flex-col gap-6">
                  {purposes.map((p) => (
                    <Switch
                      key={p.purpose}
                      checked={consents.has(p.purpose)}
                      onChange={(on) => toggle(p.purpose, on)}
                      label={p.title}
                      description={p.body}
                      tone={p.gold ? "gold" : "default"}
                    />
                  ))}
                </div>
                <p className="flex items-center gap-2 text-sm text-gold-ink">
                  <LockKey size={16} />
                  {t("nothingShown")}
                </p>
              </>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <Button variant="ghost" icon={<ArrowLeft className="rtl:-scale-x-100" />} onClick={() => setStep((s) => s - 1)} disabled={pending}>
            {tc("back")}
          </Button>
        ) : (
          <span />
        )}
        {step < TOTAL ? (
          <Button size="lg" iconEnd={<ArrowRight />} onClick={() => (step === 1 ? chooseLanguage(locale) : setStep((s) => s + 1))}>
            {tc("continue")}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="gold"
            pending={pending}
            onClick={() =>
              start(() =>
                saveOnboarding({ locale, readingLevel: level, mediaPref: media, pregnancyStatus: preg, consents: [...consents] }),
              )
            }
          >
            {t("finish")}
          </Button>
        )}
      </div>
    </div>
  );
}
