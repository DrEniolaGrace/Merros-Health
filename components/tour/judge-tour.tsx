"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowsClockwise, Compass } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { getResetPolicy, resetDemoAction, tourGo } from "@/lib/actions/auth";
import type { ResetPolicy } from "@/lib/demo/policy";
import { cn } from "@/lib/cn";

const STEPS: { key: string; persona: string; path: string }[] = [
  { key: "s1", persona: "mariam", path: "/onboarding" },
  { key: "s2", persona: "mariam", path: "/import" },
  { key: "s3", persona: "mariam", path: "/couple" },
  { key: "s4", persona: "mariam", path: "/teach-back" },
  { key: "s5", persona: "mariam", path: "/options" },
  { key: "s6", persona: "hamad", path: "/support" },
  { key: "s7", persona: "layla", path: "/counsellor" },
  { key: "s8", persona: "khalid", path: "/privacy" },
  { key: "s9", persona: "mariam", path: "/copilot" },
  { key: "s10", persona: "layla", path: "/counsellor" },
  { key: "s11", persona: "khalid", path: "/family" },
  { key: "s12", persona: "khalid", path: "/find-care" },
  { key: "s13", persona: "admin", path: "/admin" },
  { key: "s14", persona: "khalid", path: "/values" },
  { key: "s15", persona: "khalid", path: "/wellbeing" },
  { key: "s16", persona: "khalid", path: "/couple" },
  { key: "s17", persona: "khalid", path: "/video" },
];

const LATER = [
  { key: "l4", phase: 4 },
];

/** Floating Judge Tour (SPEC 10). Phase 1 steps are live; later phases are listed, not clickable. */
export function JudgeTour({ raised = false }: { raised?: boolean }) {
  const t = useTranslations("tour");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [active, setActive] = useState<string | null>(null);
  // Reset is one click on a developer machine, behind an admin passcode on a public site.
  const [policy, setPolicy] = useState<ResetPolicy | null>(null);
  const [admin, setAdmin] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [resetError, setResetError] = useState<"wrong_passcode" | "too_many" | null>(null);
  const reset = () => {
    setActive("reset");
    setResetError(null);
    start(async () => {
      const r = await resetDemoAction(passcode);
      if (r && !r.ok && r.reason !== "disabled") setResetError(r.reason);
    });
  };

  return (
    <>
      <motion.button
        onClick={() => {
          setOpen(true);
          if (policy === null) void getResetPolicy().then(setPolicy);
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "fixed end-4 z-40 inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium",
          "border border-[color-mix(in_oklab,var(--pearl-gold)_45%,transparent)] bg-[color-mix(in_oklab,var(--bg-raised)_80%,transparent)] text-gold-ink backdrop-blur-xl",
          "shadow-[0_12px_40px_-16px_var(--pearl-gold)] transition-shadow duration-500 hover:shadow-[0_16px_48px_-14px_var(--pearl-gold)]",
          raised ? "bottom-24 md:bottom-8" : "bottom-6 md:bottom-8",
        )}
      >
        <Compass size={18} />
        {t("open")}
      </motion.button>

      <Sheet open={open} onClose={() => setOpen(false)} title={t("title")} closeLabel={tc("close")}>
        <p className="mb-6 text-sm text-muted">{t("body")}</p>
        <ol className="flex flex-col gap-2">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button
                disabled={pending}
                onClick={() => {
                  setActive(s.key);
                  start(async () => { window.location.assign(await tourGo(s.persona, s.path)); });
                }}
                className="glass group flex w-full items-center gap-4 rounded-control p-4 text-start transition-[background,box-shadow] duration-500 ease-calm hover:bg-glass-strong disabled:opacity-60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm text-on-burgundy tabular">{i + 1}</span>
                <span className="flex-1 text-sm text-ink">{t(s.key)}</span>
                {pending && active === s.key ? (
                  <span className="skeleton h-5 w-5 rounded-full" aria-hidden />
                ) : (
                  <ArrowRight size={18} className="text-muted transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                )}
              </button>
            </li>
          ))}
        </ol>
        <h3 className="mb-3 mt-8 text-sm font-medium text-muted">{t("later")}</h3>
        <ul className="flex flex-col gap-2">
          {LATER.map((l) => (
            <li key={l.key} className="flex items-center justify-between gap-4 rounded-control border border-dashed border-glass-border p-4 text-sm text-muted">
              {t(l.key)}
              <Pill>{t("needsAzure")}</Pill>
            </li>
          ))}
        </ul>
        {policy === "open" && (
          <div className="mt-8">
            <Button variant="ghost" icon={<ArrowsClockwise />} pending={pending && active === "reset"} onClick={reset}>
              {pending && active === "reset" ? t("resetting") : t("reset")}
            </Button>
          </div>
        )}
        {policy === "passcode" && (
          <div className="mt-8 flex flex-col gap-3" data-reset-admin>
            {!admin ? (
              <button type="button" onClick={() => setAdmin(true)} className="self-start text-xs text-muted underline-offset-4 hover:underline">
                {t("admin")}
              </button>
            ) : (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  reset();
                }}
              >
                <label htmlFor="reset-passcode" className="text-sm text-muted">{t("passcode")}</label>
                <input
                  id="reset-passcode"
                  type="password"
                  autoComplete="off"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="glass h-12 w-full rounded-control px-4 text-base text-ink outline-none focus:shadow-[0_0_0_1px_var(--rose-light)]"
                />
                <Button type="submit" variant="ghost" icon={<ArrowsClockwise />} disabled={!passcode} pending={pending && active === "reset"} className="self-start">
                  {pending && active === "reset" ? t("resetting") : t("reset")}
                </Button>
                {resetError && <p role="alert" className="text-sm text-gold-ink">{t(resetError === "too_many" ? "passcodeTooMany" : "passcodeWrong")}</p>}
              </form>
            )}
            <p className="text-xs text-muted">{t("nightly")}</p>
          </div>
        )}
      </Sheet>
    </>
  );
}
