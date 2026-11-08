"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/** Accessible switch, used for granular consent. Off by default; nothing is pre ticked. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  tone = "default",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  tone?: "default" | "gold";
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4", disabled && "opacity-45")}>
      <div className="min-w-0">
        <label htmlFor={id} className="block text-base font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-1 inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-glass-border p-1 transition-colors duration-500 ease-calm",
          "disabled:cursor-not-allowed",
          checked
            ? tone === "gold"
              ? "bg-[color-mix(in_oklab,var(--pearl-gold)_70%,transparent)]"
              : "bg-burgundy shadow-[0_0_18px_-4px_var(--burgundy-glow)]"
            : "bg-glass",
        )}
      >
        <motion.span
          layout
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "h-6 w-6 rounded-full shadow-sm",
            checked ? "ms-auto bg-on-burgundy" : "bg-muted",
          )}
        />
      </button>
    </div>
  );
}

/** Large selectable option card (radio semantics), used for language, reading level, etc. */
export function ChoiceGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  columns = 1,
}: {
  legend: string;
  options: { value: T; label: string; description?: string; icon?: React.ReactNode; lang?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-4 text-lg font-medium text-ink">{legend}</legend>
      <div className={cn("grid gap-3", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <label
              key={o.value}
              lang={o.lang}
              className={cn(
                "glass group relative flex min-h-14 cursor-pointer items-center gap-4 rounded-control px-4 py-3",
                "transition-[box-shadow,background] duration-500 ease-calm hover:bg-glass-strong",
                "has-[:focus-visible]:shadow-[var(--focus-ring)]",
                selected && "bg-glass-strong shadow-[0_0_0_1px_var(--rose-light),0_0_28px_-10px_var(--burgundy-glow)]",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.icon && <span className="text-rose-ink">{o.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block text-base text-ink">{o.label}</span>
                {o.description && <span className="block text-sm text-muted">{o.description}</span>}
              </span>
              <span
                aria-hidden
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-colors duration-500",
                  selected ? "border-transparent bg-burgundy text-on-burgundy" : "border-glass-border",
                )}
              >
                {selected && <Check size={14} weight="bold" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Horizontal step indicator (onboarding). */
export function Steps({ total, current, label }: { total: number; current: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} className="flex gap-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-700 ease-calm",
            i < current ? "bg-[linear-gradient(90deg,var(--burgundy-glow),var(--rose-light))]" : "bg-glass-border",
          )}
        />
      ))}
    </div>
  );
}
