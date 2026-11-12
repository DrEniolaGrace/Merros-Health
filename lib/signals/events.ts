/** Vocabulary of the anonymous aggregate store (SPEC 7.2). No identity group is ever recorded. */
export const REGIONS = ["abu_dhabi", "al_ain", "al_dhafra"] as const;
export type Region = (typeof REGIONS)[number];

export const LANGUAGES = ["ar", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LEVELS = ["simple", "standard", "detailed"] as const;
export type Level = (typeof LEVELS)[number];

export const FUNNEL_STEPS = ["result_received", "understood", "counselling_offered", "counselling_booked", "counselling_completed"] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export const EVENT_KINDS = [
  ...FUNNEL_STEPS,
  "teachback_first", // value 1 = understood on the first try, 0 = needed another explanation
  "sure_pre", // value 1 = all four SURE items answered yes
  "sure_post",
  "distress_pre", // value 1 = distress thermometer 4 or above
  "distress_post",
  "copilot_question",
  "copilot_blocked",
  "invite_created",
  "invite_opened",
  "relative_tested",
  "reclass_affected",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export interface SignalEvent {
  journey: string;
  kind: EventKind;
  region: Region;
  language: Language;
  readingLevel: Level;
  value: number | null;
  at: Date;
}

/** Days from the counselling offer to the booked session, as published buckets. */
export const WAIT_BUCKETS = [
  { key: "d0_3", max: 3 },
  { key: "d4_7", max: 7 },
  { key: "d8_14", max: 14 },
  { key: "d15_plus", max: Infinity },
] as const;

export const WEEK_MS = 7 * 86_400_000;
export const HISTORY_WEEKS = 26;

/** Monday 00:00 UTC of the week containing `d`. */
export function weekStart(d: Date): Date {
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
}
