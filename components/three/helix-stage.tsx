"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/** Static, elegant helix used as the 3D fallback (reduced motion, no WebGL) and while 3D loads. */
export function HelixStatic({ className }: { className?: string }) {
  const n = 22;
  return (
    <svg viewBox="0 0 200 400" className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="hs-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--burgundy-glow)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--burgundy-glow)" stopOpacity="0" />
        </radialGradient>
        <filter id="hs-blur"><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      <ellipse cx="100" cy="200" rx="100" ry="190" fill="url(#hs-glow)" />
      <g transform="rotate(-18 100 200)" filter="url(#hs-blur)">
        {Array.from({ length: n }, (_, i) => {
          const t = i / (n - 1);
          const a = t * Math.PI * 4;
          const r2 = (n: number) => Math.round(n * 100) / 100;
          const y = r2(30 + t * 340);
          const x1 = r2(100 + Math.cos(a) * 46);
          const x2 = r2(100 - Math.cos(a) * 46);
          const front = Math.sin(a) > 0;
          return (
            <g key={i}>
              <line x1={x1} x2={x2} y1={y} y2={y} stroke="var(--rose-light)" strokeOpacity="0.25" strokeWidth="1" />
              <circle cx={x1} cy={y} r={front ? 4 : 2.6} fill="var(--burgundy-glow)" opacity={front ? 0.95 : 0.55} />
              <circle cx={x2} cy={y} r={front ? 2.6 : 4} fill={i === 11 ? "var(--pearl-gold)" : "var(--rose-light)"} opacity={front ? 0.55 : 0.9} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const LivingHelix = dynamic(() => import("./living-helix"), { ssr: false, loading: () => null });

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Lazy 3D stage. Renders the static helix first (server and first paint), then fades the live
 * scene in once loaded, unless reduced motion is requested or WebGL is unavailable.
 */
export function HelixStage({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (reduce || !webglAvailable()) return;
    const id = window.requestIdleCallback?.(() => setLive(true)) ?? window.setTimeout(() => setLive(true), 300);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [reduce]);

  return (
    <div className={cn("pointer-events-none relative", className)}>
      <HelixStatic className={cn("absolute inset-0 h-full w-full transition-opacity duration-1000", live ? "opacity-0" : "opacity-100")} />
      {live && <LivingHelix className="absolute inset-0 animate-[fade-in_1.6s_cubic-bezier(0.22,1,0.36,1)_both]" />}
    </div>
  );
}
