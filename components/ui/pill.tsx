import { BookOpenText, Compass, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export type SafetyKind = "education" | "decision_support" | "clinical_advice";

const STYLES: Record<SafetyKind, { cls: string; Icon: typeof BookOpenText }> = {
  education: {
    cls: "text-cyan-ink bg-[color-mix(in_oklab,var(--data-cyan)_12%,transparent)] border-[color-mix(in_oklab,var(--data-cyan)_30%,transparent)]",
    Icon: BookOpenText,
  },
  decision_support: {
    cls: "text-gold-ink bg-[color-mix(in_oklab,var(--pearl-gold)_12%,transparent)] border-[color-mix(in_oklab,var(--pearl-gold)_32%,transparent)]",
    Icon: Compass,
  },
  clinical_advice: {
    cls: "text-rose-ink bg-[color-mix(in_oklab,var(--burgundy-glow)_14%,transparent)] border-[color-mix(in_oklab,var(--rose-light)_35%,transparent)]",
    Icon: SealCheck,
  },
};

/** Safety Boundary Label pill (SPEC 4.7). Label text is passed in already translated. */
export function SafetyPill({ kind, label, className }: { kind: SafetyKind; label: string; className?: string }) {
  const { cls, Icon } = STYLES[kind];
  return (
    <span
      className={cn("inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-medium", cls, className)}
      data-safety-label={kind}
    >
      <Icon size={14} weight="light" aria-hidden />
      {label}
    </span>
  );
}

/** Neutral pill for tags and status. */
export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "cyan";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-medium",
        tone === "neutral" && "border-glass-border bg-glass text-muted",
        tone === "gold" && "border-[color-mix(in_oklab,var(--pearl-gold)_35%,transparent)] text-gold-ink",
        tone === "cyan" && "border-[color-mix(in_oklab,var(--data-cyan)_30%,transparent)] text-cyan-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
