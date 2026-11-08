"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/** Large glass input with a floating label and a clear focus glow (DESIGN.md section 8). */
export function Input({
  label,
  hint,
  error,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "peer glass h-14 w-full rounded-control px-4 pt-4 text-base text-ink outline-none",
            "transition-[box-shadow,background] duration-500 ease-calm",
            "focus:bg-glass-strong focus:shadow-[0_0_0_1px_var(--rose-light),0_0_24px_-6px_var(--burgundy-glow)]",
            "disabled:cursor-not-allowed disabled:opacity-45",
            error && "shadow-[0_0_0_1px_var(--pearl-gold)]",
          )}
          {...rest}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-base text-muted",
            "transition-all duration-500 ease-calm",
            "peer-focus:top-4 peer-focus:text-xs peer-focus:text-rose-ink",
            "peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-xs",
          )}
        >
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-2 text-sm text-gold-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
