"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Screen entrance: children rise gently and fade in, staggered 50ms (DESIGN.md section 6). */
export function Rise({
  children,
  className,
  stagger = 0.05,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {children}
    </Comp>
  );
}

export function RiseItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section" | "p" | "h1" | "h2";
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </Comp>
  );
}

/** Numbers count up smoothly when they appear. Final text is always the exact formatted value. */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  locale = "en",
  duration = 1.4,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  locale?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      numberingSystem: "latn",
    }).format(n);
  const [text, setText] = useState(fmt(reduce ? value : 0));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setText(fmt(value));
      return;
    }
    const c = animate(0, value, { duration, ease: EASE, onUpdate: (n) => setText(fmt(n)) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`} aria-label={`${fmt(value)}${suffix}`}>
      <span aria-hidden>
        {text}
        {suffix}
      </span>
    </span>
  );
}
