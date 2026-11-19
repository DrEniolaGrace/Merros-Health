"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ArrowsClockwise, Compass, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { getResetPolicy, resetDemoAction, tourGo } from "@/lib/actions/auth";
import type { ResetPolicy } from "@/lib/demo/policy";
import { cn } from "@/lib/cn";
import { PresenterControl, lastTourStep, setTour, useTour } from "./presenter";

/**
 * The guided tour follows the story of the demo video: one couple, Mariam and Khalid, from result
 * day to a year later. Six steps, then "Explore more". Each step signs in as the right persona and
 * opens the screen that shows it. While the tour runs, presenter controls are visible.
 */
const STEPS: { key: string; persona?: string; path?: string }[] = [
  { key: "welcome" },
  { key: "result", persona: "mariam", path: "/onboarding" },
  { key: "match", persona: "mariam", path: "/couple" },
  { key: "brief", persona: "layla", path: "/counsellor/open/khalid" },
  { key: "living", persona: "layla", path: "/counsellor" },
  { key: "signals", persona: "admin", path: "/admin" },
];
const COUNT = STEPS.length;

/** The closing card: one line about each feature not in the main story. */
const EXPLORE: { key: string; persona: string; path: string; locale?: "ar" }[] = [
  { key: "copilot", persona: "mariam", path: "/copilot", locale: "ar" },
  { key: "family", persona: "khalid", path: "/family" },
  { key: "beyond", persona: "khalid", path: "/couple" },
  { key: "findCare", persona: "khalid", path: "/find-care" },
  { key: "values", persona: "khalid", path: "/values" },
  { key: "privacy", persona: "khalid", path: "/privacy" },
];

export function JudgeTour({ raised = false, floating = true }: { raised?: boolean; floating?: boolean }) {
  const t = useTranslations("tour");
  const tour = useTour();
  const parsed = tour ? /^(\d+)(m?)$/.exec(tour) : null;
  const step = parsed ? Number(parsed[1]) : null; // 1..6, 7 = Explore more
  const minimised = !!parsed?.[2];
  const [pending, start] = useTransition();
  const [active, setActive] = useState<string | null>(null);
  const card = useRef<HTMLElement>(null);

  // A click outside the card, or Escape, tucks it away without ending the tour.
  useEffect(() => {
    if (step === null || minimised) return;
    const tuck = () => setTour(`${step}m`);
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (card.current && el && !card.current.contains(el) && !el.closest("[data-presenter-control]")) tuck();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && tuck();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [step, minimised]);

  /** Shows step n, opening its screen when it has one. */
  const go = (n: number) => {
    setTour(String(n));
    const s = STEPS[n - 1];
    if (s?.persona && s.path) {
      setActive(`step-${n}`);
      start(async () => { window.location.assign(await tourGo(s.persona!, s.path!)); });
    }
  };

  const bottom = raised ? "bottom-24 md:bottom-8" : "bottom-6 md:bottom-8";

  return (
    <>
      {floating && (step === null || minimised) && (
        <motion.button
          data-judge-tour-button
          // Reopening resumes at the step the tour was on; the card offers "Start over".
          onClick={() => (step !== null ? setTour(String(step)) : lastTourStep() > 1 ? setTour(String(lastTourStep())) : go(1))}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "fixed end-4 z-40 inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium",
            "border border-[color-mix(in_oklab,var(--pearl-gold)_45%,transparent)] bg-[color-mix(in_oklab,var(--bg-raised)_80%,transparent)] text-gold-ink backdrop-blur-xl",
            "shadow-[0_12px_40px_-16px_var(--pearl-gold)] transition-shadow duration-500 hover:shadow-[0_16px_48px_-14px_var(--pearl-gold)]",
            bottom,
          )}
        >
          <Compass size={18} />
          {t("open")}
          {step !== null && <span className="text-xs text-muted tabular">· {step <= COUNT ? t("stepOf", { n: step, total: COUNT }) : t("exploreEyebrow")}</span>}
        </motion.button>
      )}

      <AnimatePresence>
        {step !== null && !minimised && (
          <motion.section
            ref={card}
            key="tour-card"
            role="dialog"
            aria-modal="false"
            aria-labelledby="tour-title"
            data-tour-card={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed inset-x-4 z-50 flex max-h-[75vh] flex-col gap-4 overflow-y-auto rounded-card p-5 md:inset-x-auto md:end-8 md:w-[26rem]",
              "border border-[color-mix(in_oklab,var(--pearl-gold)_40%,transparent)] bg-[color-mix(in_oklab,var(--bg-raised)_92%,transparent)] shadow-[0_24px_60px_-24px_var(--pearl-gold)] backdrop-blur-xl",
              bottom,
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gold-ink">
                <Compass size={16} />
                {step <= COUNT ? t("stepOf", { n: step, total: COUNT }) : t("exploreEyebrow")}
              </span>
              <span className="-me-2 inline-flex items-center">
                {step > 1 && (
                  <button type="button" onClick={() => go(1)} className="inline-flex h-10 items-center rounded-full px-3 text-sm text-muted hover:text-ink">
                    {t("startOver")}
                  </button>
                )}
                <button type="button" onClick={() => setTour(null)} aria-label={t("exit")} className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted hover:text-ink">
                  <X size={16} />
                  {t("exit")}
                </button>
              </span>
            </div>

            {step <= COUNT ? (
              <>
                <h2 id="tour-title" className="text-xl font-medium text-ink">{t(`${STEPS[step - 1].key}.title`)}</h2>
                <p className="text-sm leading-relaxed text-muted">{t(`${STEPS[step - 1].key}.body`)}</p>
                <div className="flex gap-1" aria-hidden>
                  {STEPS.map((s, i) => (
                    <span key={s.key} className={cn("h-1 flex-1 rounded-full", i < step ? "bg-[var(--pearl-gold)]" : "bg-glass-border")} />
                  ))}
                </div>
              </>
            ) : (
              <Explore pending={pending} active={active} onOpen={(e) => { setActive(e.key); start(async () => { window.location.assign(await tourGo(e.persona, e.path, e.locale)); }); }} />
            )}

            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" icon={<ArrowLeft className="rtl:-scale-x-100" />} disabled={step === 1 || pending} onClick={() => go(step - 1)} className="-ms-3">
                {t("back")}
              </Button>
              {step <= COUNT ? (
                <Button variant="gold" iconEnd={<ArrowRight size={16} />} disabled={pending} pending={pending && active === `step-${step + 1}`} onClick={() => go(step + 1)}>
                  {t("next")}
                </Button>
              ) : (
                <Button variant="gold" onClick={() => setTour(null)}>{t("finish")}</Button>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Explore({ pending, active, onOpen }: { pending: boolean; active: string | null; onOpen: (e: (typeof EXPLORE)[number]) => void }) {
  const t = useTranslations("tour");
  return (
    <>
      <h2 id="tour-title" className="text-xl font-medium text-ink">{t("explore.title")}</h2>
      <ul className="flex flex-col gap-2">
        {EXPLORE.map((e) => (
          <li key={e.key}>
            <button
              type="button"
              disabled={pending}
              onClick={() => onOpen(e)}
              data-tour-explore={e.key}
              className="glass group flex w-full items-center gap-3 rounded-control p-3 text-start transition-[background] duration-500 hover:bg-glass-strong disabled:opacity-60"
            >
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-ink">{t(`explore.${e.key}.title`)}</span>
                <span className="text-xs text-muted">{t(`explore.${e.key}.body`)}</span>
              </span>
              {pending && active === e.key ? <span className="skeleton h-5 w-5 rounded-full" aria-hidden /> : <ArrowRight size={16} className="text-muted rtl:-scale-x-100" />}
            </button>
          </li>
        ))}
      </ul>
      <ResetDemo />
    </>
  );
}

/** Reset the demo data: a presenter control, behind the admin passcode on the public site. */
function ResetDemo() {
  const t = useTranslations("tour");
  const [policy, setPolicy] = useState<ResetPolicy | null>(null);
  const [passcode, setPasscode] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<"wrong_passcode" | "too_many" | null>(null);
  const reset = () => {
    setError(null);
    start(async () => {
      const r = await resetDemoAction(passcode);
      if (r && !r.ok && r.reason !== "disabled") setError(r.reason);
    });
  };
  useEffect(() => {
    void getResetPolicy().then(setPolicy);
  }, []);
  if (policy === null || policy === "disabled") return null;
  return (
    <PresenterControl className="mt-2">
      {policy === "open" ? (
        <Button variant="ghost" icon={<ArrowsClockwise />} pending={pending} onClick={reset} className="-ms-3">
          {pending ? t("resetting") : t("reset")}
        </Button>
      ) : (
        <form
          className="flex w-full flex-col gap-2"
          data-reset-admin
          onSubmit={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <label htmlFor="reset-passcode" className="text-xs text-muted">{t("passcode")}</label>
          <input
            id="reset-passcode"
            type="password"
            autoComplete="off"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="glass h-11 w-full rounded-control px-4 text-base text-ink outline-none focus:shadow-[0_0_0_1px_var(--rose-light)]"
          />
          <Button type="submit" variant="ghost" icon={<ArrowsClockwise />} disabled={!passcode} pending={pending} className="-ms-3 self-start">
            {pending ? t("resetting") : t("reset")}
          </Button>
          {error && <p role="alert" className="text-sm text-gold-ink">{t(error === "too_many" ? "passcodeTooMany" : "passcodeWrong")}</p>}
          <p className="text-xs text-muted">{t("nightly")}</p>
        </form>
      )}
    </PresenterControl>
  );
}
