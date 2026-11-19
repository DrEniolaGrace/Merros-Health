"use client";

import { useEffect } from "react";

/**
 * Gentle scroll reveal for elements marked with the class `reveal`: each rises and fades in once,
 * the first time it comes into view. No animation library: one IntersectionObserver and CSS
 * (globals.css). Content is visible without JavaScript, and reduced motion shows it still.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const seen = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            seen.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    // Anything already on screen shows at once; the rest waits for the scroll.
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-visible");
      else seen.observe(el);
    }
    root.classList.add("reveal-ready");
    return () => {
      seen.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
  return null;
}
