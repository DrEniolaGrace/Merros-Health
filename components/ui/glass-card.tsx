"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * The one card style for the whole app (DESIGN.md section 8).
 * `tilt` makes the card lean toward the pointer (max 4 degrees) with a moving light reflection.
 * `tone="gold"` marks precious moments (consent, reveal, shared gene).
 */
export function GlassCard({
  children,
  className,
  tilt = false,
  tone = "default",
  as = "div",
  hero = false,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  tone?: "default" | "gold";
  as?: "div" | "section" | "article" | "li";
  hero?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 120, damping: 20 });
  const ry = useSpring(0, { stiffness: 120, damping: 20 });
  const lx = useMotionValue(50);
  const ly = useMotionValue(0);
  const light = useMotionTemplate`radial-gradient(420px circle at ${lx}% ${ly}%, var(--glass-highlight), transparent 55%)`;
  const active = tilt && !reduce;

  function onMove(e: React.PointerEvent) {
    if (!active || !ref.current || e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 8);
    rx.set(-(py - 0.5) * 8);
    lx.set(px * 100);
    ly.set(py * 100);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={active ? { rotateX: rx, rotateY: ry, transformPerspective: 900 } : undefined}
      className={cn(
        "glass relative isolate overflow-hidden p-6",
        hero ? "rounded-hero p-8" : "rounded-card",
        tone === "gold" && "border-[color-mix(in_oklab,var(--pearl-gold)_45%,transparent)]",
        className,
      )}
      {...(rest as object)}
    >
      {active && (
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: light }} />
      )}
      {tone === "gold" && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 start-1/2 -z-10 h-48 w-72 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl rtl:translate-x-1/2"
        />
      )}
      {children}
    </Comp>
  );
}
