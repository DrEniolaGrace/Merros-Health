import { cn } from "@/lib/cn";
import { Eyebrow, Horizon } from "./accents";
import { SafetyPill, type SafetyKind } from "./pill";

/**
 * Hero panel for key screens (result, couple, care): glowing horizon, eyebrow, gradient title,
 * optional gold accent line, badges row, and an optional visual on the end side.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  body,
  label,
  badges,
  aside,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  body?: string;
  label?: { kind: SafetyKind; text: string };
  badges?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass relative isolate overflow-hidden rounded-hero px-6 py-8 sm:px-10 sm:py-10", className)}>
      <Horizon className="-bottom-32 -z-10 opacity-80 sm:-bottom-48" />
      <span aria-hidden className="pointer-events-none absolute -start-20 -top-20 -z-10 h-56 w-80 rounded-full bg-burgundy-glow/20 blur-3xl" />
      <div className={cn("grid items-center gap-8", aside && "lg:grid-cols-[1fr_auto]")}>
        <div className="flex min-w-0 flex-col gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl">
            <span className="text-gradient block">{title}</span>
            {accent && <span className="text-gradient-gold mt-1 block text-2xl sm:text-3xl">{accent}</span>}
          </h1>
          {body && <p className="measure text-muted">{body}</p>}
          {(label || badges) && (
            <div className="flex flex-wrap items-center gap-2">
              {label && <SafetyPill kind={label.kind} label={label.text} />}
              {badges}
            </div>
          )}
          {children}
        </div>
        {aside && <div className="relative justify-self-center">{aside}</div>}
      </div>
    </section>
  );
}

/** Glowing gene badge: the gene symbol inside a ring of light (gold for shared genes). */
export function GeneOrb({ gene, tone = "rose", size = 72 }: { gene: string; tone?: "rose" | "gold" | "cyan"; size?: number }) {
  const ring =
    tone === "gold"
      ? "shadow-[0_0_0_1.5px_var(--pearl-gold),0_0_40px_-6px_var(--pearl-gold)] text-gold-ink"
      : tone === "cyan"
        ? "shadow-[0_0_0_1.5px_var(--data-cyan),0_0_36px_-8px_var(--data-cyan)] text-cyan-ink"
        : "shadow-[0_0_0_1.5px_var(--rose-light),0_0_36px_-8px_var(--burgundy-glow)] text-rose-ink";
  return (
    <span
      dir="ltr"
      style={{ width: size, height: size, fontSize: size * 0.24 }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold tracking-tight",
        "bg-[radial-gradient(circle_at_35%_30%,color-mix(in_oklab,var(--glass-strong)_100%,transparent),transparent_70%)]",
        ring,
      )}
    >
      <span aria-hidden className="absolute inset-1.5 animate-[spin_30s_linear_infinite] rounded-full border border-dashed border-current opacity-30" />
      {gene}
    </span>
  );
}
