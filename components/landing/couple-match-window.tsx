"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Key, LockKey, LockKeyOpen, Sparkle } from "@phosphor-icons/react";
import { LiveBadge } from "@/components/ui/accents";
import { cn } from "@/lib/cn";

export interface CoupleMatchLabels {
  title: string;
  partnerA: string;
  partnerB: string;
  sealed: string;
  keyTurned: string;
  matching: string;
  matched: string;
  shared: string;
  stillSealed: string;
  note: string;
  illustration: string;
}

const STAGES = 5; // 0 sealed, 1 A key, 2 B key, 3 matching, 4 shared gene revealed
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Illustration of Blind Couple Match (SPEC 6.1): two sealed results, Dual Key consent, blinded
 * points exchanged, and only the shared gene revealed. It is an animation, not live data.
 */
export function CoupleMatchWindow({ labels, className }: { labels: CoupleMatchLabels; className?: string }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(reduce ? 4 : 0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setStage((s) => (s + 1) % (STAGES + 1)), 1900);
    return () => window.clearInterval(id);
  }, [reduce]);

  const s = Math.min(stage, 4);
  const status = s === 4 ? labels.matched : s === 3 ? labels.matching : s >= 1 ? labels.keyTurned : labels.sealed;

  return (
    <div className={cn("glass overflow-hidden rounded-hero shadow-[var(--glow-float)]", className)} role="img" aria-label={`${labels.title}. ${labels.note}`}>
      {/* Window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-glass-border px-4 py-3">
        <div className="hidden items-center gap-2 sm:flex" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-glass-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-glass-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-glass-strong" />
        </div>
        <span className="flex min-w-0 items-center gap-2 truncate text-sm text-ink">
          <span className="h-3 w-3 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--rose-light),var(--burgundy-glow))] shadow-[0_0_10px_var(--burgundy-glow)]" />
          {labels.title}
        </span>
        <LiveBadge tone={s === 4 ? "gold" : "cyan"}>{status}</LiveBadge>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-6">
        <PartnerOrb label={labels.partnerA} turned={s >= 1} revealed={s === 4} />
        <ExchangeBeam active={s === 3} done={s === 4} sharedLabel={labels.shared} />
        <PartnerOrb label={labels.partnerB} turned={s >= 2} revealed={s === 4} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-glass-border px-4 py-3 text-xs text-muted sm:px-6">
        <span>{labels.note}</span>
        <span className="uppercase tracking-[0.14em]">{labels.illustration}</span>
      </div>
      <span className="sr-only">{labels.stillSealed}</span>
    </div>
  );
}

function PartnerOrb({ label, turned, revealed }: { label: string; turned: boolean; revealed: boolean }) {
  const genes = ["HBB", "■■■", "■■■■", "■■"];
  return (
    <div className="glass corner-dots flex flex-col gap-3 rounded-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-ink">{label}</span>
        <motion.span
          animate={{ rotate: turned ? 90 : 0, color: turned ? "var(--gold-ink)" : "var(--text-secondary)" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-glass-strong"
        >
          <Key size={16} />
        </motion.span>
      </div>
      <div className="flex flex-wrap gap-2" dir="ltr">
        {genes.map((g, i) => {
          const isShared = i === 0;
          const show = isShared && revealed;
          return (
            <motion.span
              key={i}
              animate={{
                opacity: show ? 1 : 0.55,
                boxShadow: show ? "0 0 22px -4px var(--pearl-gold)" : "0 0 0 0 transparent",
              }}
              transition={{ duration: 0.7, ease: EASE }}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs tabular",
                show ? "border-[color-mix(in_oklab,var(--pearl-gold)_60%,transparent)] text-gold-ink" : "border-glass-border text-muted",
              )}
            >
              {show ? <LockKeyOpen size={12} /> : <LockKey size={12} />}
              {show ? g : "••••"}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

function ExchangeBeam({ active, done, sharedLabel }: { active: boolean; done: boolean; sharedLabel: string }) {
  return (
    <div className="relative flex h-16 items-center justify-center sm:h-auto sm:w-28 sm:flex-col">
      <span className="absolute inset-x-6 top-1/2 h-px bg-[linear-gradient(90deg,transparent,var(--rose-light),transparent)] opacity-60 sm:inset-x-0" aria-hidden />
      <AnimatePresence>
        {active &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-rose shadow-[0_0_10px_var(--rose-light)]"
              initial={{ left: i % 2 ? "100%" : "0%", opacity: 0 }}
              animate={{ left: i % 2 ? "0%" : "100%", opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: i * 0.25, repeat: 1 }}
            />
          ))}
      </AnimatePresence>
      <AnimatePresence>
        {done && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative z-10 inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#e9d6a6,var(--pearl-gold))] px-3 py-1 text-xs font-medium text-[#1e0e14] shadow-[0_0_30px_-4px_var(--pearl-gold)]"
          >
            <Sparkle size={12} weight="fill" />
            {sharedLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
