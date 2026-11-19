"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

/**
 * Judge Mode. Presenter controls (switching phones, simulating a tampered delivery or a ClinVar
 * update, resetting the demo) only appear while the guided tour is running. The tour keeps its state
 * in a cookie so it survives page changes and persona switches:
 *   a number 1 to 7  the tour card is showing that step (7 is "Explore more")
 *   "4m"             step 4, card tucked away into a small button (after a click outside it)
 *   "p"              presenter controls on, no tour card (recordings and automated tests)
 * The last step is also remembered on its own, so reopening the tour resumes where it was left.
 */
export const TOUR_COOKIE = "merros-tour";
const LAST_COOKIE = "merros-tour-last";
const EVENT = "merros-tour";

function read(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${TOUR_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** The tour state: null when the tour is off. */
export function useTour(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function setTour(value: string | null) {
  document.cookie = value === null ? `${TOUR_COOKIE}=; path=/; max-age=0; samesite=lax` : `${TOUR_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=86400; samesite=lax`;
  const step = value ? /^(\d+)/.exec(value)?.[1] : undefined;
  if (step) document.cookie = `${LAST_COOKIE}=${step}; path=/; max-age=86400; samesite=lax`;
  window.dispatchEvent(new Event(EVENT));
}

/** The step the tour was last on (1 when it has not been opened yet). */
export function lastTourStep(): number {
  const m = document.cookie.match(new RegExp(`(?:^|; )${LAST_COOKIE}=(\\d+)`));
  return m ? Number(m[1]) : 1;
}

/** Shows its children only during the guided tour, labelled "Presenter control". */
export function PresenterControl({ children, className }: { children: ReactNode; className?: string }) {
  const tour = useTour();
  const t = useTranslations("tour");
  if (tour === null) return null;
  return (
    <div data-presenter-control className={cn("flex flex-col items-start gap-1", className)}>
      <span className="rounded-full border border-[color-mix(in_oklab,var(--pearl-gold)_45%,transparent)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-gold-ink">{t("presenter")}</span>
      {children}
    </div>
  );
}
