"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Risk visuals (SPEC 4.3). Calm data tones only: data cyan for "affected", soft rose outline for
 * "carrier", neutral glass for "not a carrier". Never red. Every visual has a text alternative.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export interface FourSquareLabels {
  title: string;
  parentA: string;
  parentB: string;
  nonCarrier: string;
  carrier: string;
  affected: string;
  /** Full sentence read by screen readers. */
  summary: string;
}

/** 4 square inheritance grid for two carrier parents of an AR condition. */
export function FourSquareGrid({ labels, className }: { labels: FourSquareLabels; className?: string }) {
  const reduce = useReducedMotion();
  const cells: { kind: "non" | "carrier" | "affected"; genotype: string }[] = [
    { kind: "non", genotype: "AA" },
    { kind: "carrier", genotype: "Aa" },
    { kind: "carrier", genotype: "aA" },
    { kind: "affected", genotype: "aa" },
  ];
  const text = { non: labels.nonCarrier, carrier: labels.carrier, affected: labels.affected };
  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{labels.summary}</figcaption>
      <div aria-hidden className="grid grid-cols-[auto_1fr_1fr] gap-2 text-xs text-muted">
        <span />
        <span className="text-center">{labels.parentB} A</span>
        <span className="text-center">{labels.parentB} a</span>
        {[0, 1].map((row) => (
          <div key={row} className="contents">
            <span className="flex items-center justify-end pe-2">{labels.parentA} {row ? "a" : "A"}</span>
            {[0, 1].map((col) => {
              const c = cells[row * 2 + col];
              return (
                <motion.div
                  key={col}
                  initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.15 + (row * 2 + col) * 0.12 }}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-control border p-2 text-center",
                    c.kind === "non" && "border-glass-border bg-glass",
                    c.kind === "carrier" && "border-[color-mix(in_oklab,var(--rose-light)_45%,transparent)] bg-[color-mix(in_oklab,var(--rose-light)_8%,transparent)]",
                    c.kind === "affected" && "border-[color-mix(in_oklab,var(--data-cyan)_55%,transparent)] bg-[color-mix(in_oklab,var(--data-cyan)_16%,transparent)]",
                  )}
                >
                  <span className="font-display text-lg text-ink tabular" dir="ltr">{c.genotype}</span>
                  <span className={cn("text-xs", c.kind === "affected" ? "text-cyan-ink" : c.kind === "carrier" ? "text-rose-ink" : "text-muted")}>
                    {text[c.kind]}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </figure>
  );
}

/** A small person glyph. */
function Figure({ kind }: { kind: "affected" | "carrier" | "non" }) {
  const fill = kind === "affected" ? "var(--data-cyan)" : kind === "carrier" ? "none" : "var(--glass-border)";
  const stroke = kind === "carrier" ? "var(--rose-light)" : "none";
  return (
    <svg viewBox="0 0 10 14" className="h-full w-full">
      <circle cx="5" cy="3" r="2.3" fill={fill} stroke={stroke} strokeWidth="0.9" />
      <path d="M1.2 13.2 C1.2 8 2.8 6.4 5 6.4 C7.2 6.4 8.8 8 8.8 13.2 Z" fill={fill} stroke={stroke} strokeWidth="0.9" />
    </svg>
  );
}

/**
 * 100 figure grid. Counts must be integers summing to <= 100; callers round exact fractions
 * and say "about" when rounding happened.
 */
export function HundredGrid({
  affected,
  carrier = 0,
  summary,
  className,
}: {
  affected: number;
  carrier?: number;
  summary: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const kinds = Array.from({ length: 100 }, (_, i) => (i < affected ? "affected" : i < affected + carrier ? "carrier" : "non") as "affected" | "carrier" | "non");
  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{summary}</figcaption>
      <div aria-hidden className="grid grid-cols-10 gap-1 sm:gap-2">
        {kinds.map((k, i) => (
          <motion.div
            key={i}
            className="aspect-[10/14]"
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 + (i % 10) * 0.02 + Math.floor(i / 10) * 0.04 }}
          >
            <Figure kind={k} />
          </motion.div>
        ))}
      </div>
    </figure>
  );
}

export function Legend({ items }: { items: { kind: "affected" | "carrier" | "non"; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-sm text-muted">
      {items.map((it) => (
        <li key={it.kind} className="flex items-center gap-2">
          <span className="h-4 w-3"><Figure kind={it.kind} /></span>
          {it.label}
        </li>
      ))}
    </ul>
  );
}
