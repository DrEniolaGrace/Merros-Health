import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/** Uppercase eyebrow pill above headings (announcement and section labels). */
export function Eyebrow({
  children,
  icon = true,
  className,
  tone = "rose",
}: {
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
  tone?: "rose" | "gold";
}) {
  return (
    <span
      className={cn(
        "glass inline-flex h-8 w-fit items-center gap-2 rounded-full px-3 text-xs font-medium uppercase tracking-[0.14em]",
        tone === "gold" ? "text-gold-ink" : "text-rose-ink",
        className,
      )}
    >
      {icon && <Sparkle size={12} weight="fill" aria-hidden />}
      {children}
    </span>
  );
}

/** Small status badge with a pulsing dot, e.g. LIVE, SEALED, VERIFIED. */
export function LiveBadge({ children, tone = "cyan", className }: { children: React.ReactNode; tone?: "cyan" | "gold" | "rose"; className?: string }) {
  const color = tone === "cyan" ? "text-cyan-ink" : tone === "gold" ? "text-gold-ink" : "text-rose-ink";
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full border px-3 text-xs font-medium uppercase tracking-[0.14em]",
        tone === "cyan" && "border-[color-mix(in_oklab,var(--data-cyan)_35%,transparent)] bg-[color-mix(in_oklab,var(--data-cyan)_10%,transparent)]",
        tone === "gold" && "border-[color-mix(in_oklab,var(--pearl-gold)_40%,transparent)] bg-[color-mix(in_oklab,var(--pearl-gold)_10%,transparent)]",
        tone === "rose" && "border-[color-mix(in_oklab,var(--rose-light)_35%,transparent)] bg-[color-mix(in_oklab,var(--rose-light)_10%,transparent)]",
        color,
        className,
      )}
    >
      <span className="pulse-dot h-1.5 w-1.5" aria-hidden />
      {children}
    </span>
  );
}

/** Floating glass status chip with corner dots (hero decoration with real meaning). */
export function FloatingChip({
  icon,
  title,
  meta,
  className,
  tone = "default",
}: {
  icon?: React.ReactNode;
  title: string;
  meta?: string;
  className?: string;
  tone?: "default" | "gold" | "cyan";
}) {
  return (
    <div
      className={cn(
        "glass corner-dots inline-flex items-center gap-3 rounded-control py-2 pe-4 ps-3 text-sm shadow-[var(--glow-float)]",
        tone === "gold" && "border-[color-mix(in_oklab,var(--pearl-gold)_40%,transparent)]",
        tone === "cyan" && "border-[color-mix(in_oklab,var(--data-cyan)_35%,transparent)]",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            tone === "gold" ? "bg-[color-mix(in_oklab,var(--pearl-gold)_18%,transparent)] text-gold-ink" : tone === "cyan" ? "bg-[color-mix(in_oklab,var(--data-cyan)_16%,transparent)] text-cyan-ink" : "bg-glass-strong text-rose-ink",
          )}
        >
          {icon}
        </span>
      )}
      <span className="text-ink">{title}</span>
      {meta && <span className="text-xs text-muted tabular">{meta}</span>}
    </div>
  );
}

/** Row of headline numbers separated by hairlines (DESIGN.md: numbers formatted with care). */
export function StatRow({ items, className }: { items: { value: React.ReactNode; label: string }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-y-6 sm:flex sm:flex-wrap", className)}>
      {items.map((it, i) => (
        <div key={i} className={cn("flex flex-col gap-1 px-4 sm:min-w-40 sm:flex-1 sm:border-s sm:border-glass-border", i === 0 && "sm:border-s-0 sm:ps-0")}>
          <dd className="font-display text-3xl font-semibold tracking-tight text-ink tabular" dir="ltr">{it.value}</dd>
          <dt className="max-w-48 text-sm text-muted">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/** Segmented meter of N pills, `filled` of them lit (calm data tone). */
export function DotMeter({ total, filled, label, className }: { total: number; filled: number; label: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={cn("flex h-8 items-stretch gap-[3px]", className)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 rounded-[3px] transition-[background,box-shadow] duration-700 ease-calm",
            i < filled
              ? "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--data-cyan)_90%,white),var(--data-cyan))] shadow-[0_0_10px_-2px_var(--data-cyan)]"
              : "bg-glass-strong",
          )}
          style={{ transitionDelay: `${i * 12}ms` }}
        />
      ))}
    </div>
  );
}

/** Glowing arc of light behind hero content. Place inside a `relative overflow-hidden` parent. */
export function Horizon({ className }: { className?: string }) {
  return <div aria-hidden className={cn("horizon", className)} />;
}
