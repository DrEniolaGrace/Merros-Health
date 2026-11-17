"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

export type Theme = "night" | "pearl";
export const THEME_COOKIE = "merros-theme";

/** Night (signature) / Pearl switch. Persists in a cookie so the server renders the right mode. */
export function ThemeToggle({ labels }: { labels: { toNight: string; toPearl: string } }) {
  const [theme, setTheme] = useState<Theme>("night");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "pearl" ? "pearl" : "night");
  }, []);
  function toggle() {
    const next: Theme = theme === "night" ? "pearl" : "night";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setTheme(next);
  }
  const label = theme === "night" ? labels.toPearl : labels.toNight;
  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-12 w-12 items-center justify-center rounded-full text-muted transition-[background,color] duration-500 ease-calm hover:bg-glass hover:text-ink active:scale-95"
    >
      {theme === "night" ? <Sun /> : <Moon />}
    </button>
  );
}
