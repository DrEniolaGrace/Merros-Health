"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "gold";
type Size = "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconEnd?: React.ReactNode;
  children?: React.ReactNode;
  /** Shows a skeleton shimmer instead of a spinner while an action is pending. */
  pending?: boolean;
  block?: boolean;
}

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium " +
  "transition-[background,box-shadow,color,filter,opacity] duration-500 ease-calm " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:saturate-50";

const variants: Record<Variant, string> = {
  primary:
    "text-on-burgundy shadow-[var(--glow-primary)] " +
    "bg-[linear-gradient(135deg,var(--burgundy),color-mix(in_oklab,var(--burgundy)_70%,var(--burgundy-glow)))] " +
    "hover:brightness-115 enabled:hover:shadow-[0_14px_44px_-10px_var(--burgundy-glow),0_0_0_1px_var(--rose-light)]",
  secondary: "glass text-ink hover:bg-glass-strong",
  ghost: "text-ink hover:bg-glass",
  gold:
    "text-[#1e0e14] bg-[linear-gradient(135deg,#e9d6a6,var(--pearl-gold))] " +
    "shadow-[0_10px_36px_-12px_var(--pearl-gold)] hover:brightness-105",
};

const sizes: Record<Size, string> = {
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, iconEnd, children, className, pending, disabled, block, ...rest },
  ref,
) {
  const isDisabled = disabled || pending;
  return (
    <motion.button
      ref={ref}
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.98, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
      {...rest}
    >
      {pending && <span aria-hidden className="skeleton absolute inset-0 rounded-control opacity-60" />}
      {icon && <span className="relative shrink-0">{icon}</span>}
      {children && <span className="relative">{children}</span>}
      {iconEnd && <span className="relative shrink-0 rtl:-scale-x-100">{iconEnd}</span>}
    </motion.button>
  );
});
