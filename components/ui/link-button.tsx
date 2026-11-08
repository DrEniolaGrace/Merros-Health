import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "gold";

const variants: Record<Variant, string> = {
  primary:
    "text-on-burgundy shadow-[var(--glow-primary)] bg-[linear-gradient(135deg,var(--burgundy),color-mix(in_oklab,var(--burgundy)_70%,var(--burgundy-glow)))] hover:brightness-115 hover:-translate-y-px",
  secondary: "glass text-ink hover:bg-glass-strong hover:-translate-y-px",
  ghost: "text-ink hover:bg-glass",
  gold: "text-[#1e0e14] bg-[linear-gradient(135deg,#e9d6a6,var(--pearl-gold))] shadow-[0_10px_36px_-12px_var(--pearl-gold)] hover:brightness-105 hover:-translate-y-px",
};

/** A navigation link styled exactly like Button (same states), for server components. */
export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  className,
  block,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: "md" | "lg";
  icon?: React.ReactNode;
  iconEnd?: React.ReactNode;
  className?: string;
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium",
        "transition-[background,box-shadow,filter,transform] duration-500 ease-calm active:scale-[0.98]",
        size === "md" ? "h-12 px-6 text-sm" : "h-14 px-8 text-base",
        variants[variant],
        block && "w-full",
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconEnd && <span className="shrink-0 rtl:-scale-x-100">{iconEnd}</span>}
    </Link>
  );
}
