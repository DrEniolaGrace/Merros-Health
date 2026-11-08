"use client";

import { MotionConfig } from "motion/react";
import { IconContext } from "@phosphor-icons/react";

/** App wide client providers: calm motion defaults (respecting reduced motion) and one icon weight. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <IconContext.Provider value={{ weight: "light", size: 20, mirrored: false }}>
        {children}
      </IconContext.Provider>
    </MotionConfig>
  );
}
