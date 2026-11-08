import { cn } from "@/lib/cn";

/** Monogram avatar for clinicians (no stock photos). */
export function Monogram({ name, size = 48, className }: { name: string; size?: number; className?: string }) {
  const letters = name
    .replace(/^(Dr\.?|د\.)\s*/u, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium text-on-burgundy",
        "bg-[radial-gradient(circle_at_30%_25%,var(--burgundy-glow),var(--burgundy))]",
        "shadow-[0_0_0_1.5px_var(--pearl-gold),0_8px_24px_-8px_var(--burgundy-glow)]",
        className,
      )}
    >
      {letters}
    </span>
  );
}
