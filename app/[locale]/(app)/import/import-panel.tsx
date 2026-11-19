"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Seal, SealCheck, ShieldWarning } from "@phosphor-icons/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { importAction } from "@/lib/actions/patient";
import { PresenterControl } from "@/components/tour/presenter";
import type { ImportOutcome } from "@/lib/services/results";

export function ImportPanel({ lab }: { lab: string }) {
  const t = useTranslations("import");
  const [pending, start] = useTransition();
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [which, setWhich] = useState<"real" | "tamper" | null>(null);

  function run(tamper: boolean) {
    setWhich(tamper ? "tamper" : "real");
    start(async () => setOutcome(await importAction(tamper)));
  }

  return (
    <AnimatePresence mode="wait">
      {!outcome?.ok ? (
        <motion.div key="seal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-6">
          <GlassCard tone="gold" hero className="flex flex-col items-start gap-6">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pearl-gold)_18%,transparent)] text-gold-ink shadow-[0_0_40px_-10px_var(--pearl-gold)]">
              <Seal size={32} />
            </span>
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="measure text-muted">{t("body", { lab })}</p>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="gold" icon={<SealCheck />} pending={pending && which === "real"} disabled={pending} onClick={() => run(false)}>
                {t("verify")}
              </Button>
              <PresenterControl>
                <Button variant="ghost" disabled={pending} pending={pending && which === "tamper"} onClick={() => run(true)}>
                  {t("tamper")}
                </Button>
              </PresenterControl>
            </div>
          </GlassCard>
          {outcome && !outcome.ok && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <GlassCard className="flex items-start gap-4" role="alert">
                <ShieldWarning size={28} className="shrink-0 text-gold-ink" />
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-medium">{t("rejectedTitle")}</h2>
                  <p className="text-sm text-muted">{t("rejectedBody")}</p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div key="ok" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <GlassCard hero className="flex flex-col items-start gap-6">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--data-cyan)_16%,transparent)] text-cyan-ink"
            >
              <SealCheck size={32} />
            </motion.span>
            <h1 className="text-3xl font-semibold">{t("verifiedTitle")}</h1>
            <p className="measure text-muted">{t("verifiedBody")}</p>
            <LinkButton href="/result" size="lg" iconEnd={<ArrowRight size={20} />}>{t("open")}</LinkButton>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
