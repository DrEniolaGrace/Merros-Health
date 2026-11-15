/**
 * Values Compass logic (SPEC 4.6). Pure and deterministic. It relates options to the person's own
 * stated values and never chooses: no option gets a score, a rank or a "best fit".
 */
import { IMPORTANT_FROM, OPTION_FIT, OPTION_IDS, SURE_ITEMS, VALUE_KEYS, type OptionId, type ValueKey } from "@/content/values";

export type Ratings = Record<ValueKey, number>;
export type SureAnswers = Record<(typeof SURE_ITEMS)[number]["key"], boolean>;

export const MIN_RATING = 0;
export const MAX_RATING = 4;

/** True only when every value has a whole number rating from 0 to 4. */
export function validRatings(r: unknown): r is Ratings {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return VALUE_KEYS.every((k) => Number.isInteger(o[k]) && (o[k] as number) >= MIN_RATING && (o[k] as number) <= MAX_RATING) && Object.keys(o).length === VALUE_KEYS.length;
}

export function validSure(a: unknown): a is SureAnswers {
  if (!a || typeof a !== "object") return false;
  const o = a as Record<string, unknown>;
  return SURE_ITEMS.every((i) => typeof o[i.key] === "boolean") && Object.keys(o).length === SURE_ITEMS.length;
}

/** The values the person marked as very important or essential, in the fixed display order. */
export function importantValues(r: Ratings): ValueKey[] {
  return VALUE_KEYS.filter((k) => r[k] >= IMPORTANT_FROM);
}

export interface OptionFit {
  optionId: OptionId;
  fits: ValueKey[];
  tension: ValueKey[];
  depends: ValueKey[];
}

/**
 * For each option, which of the person's important values it tends to fit, may pull against, or
 * depends on their situation. The options keep the order they are given in (the caller shuffles
 * them per person, as in the Options Explorer). Nothing is counted, summed or sorted by fit.
 */
export function relateOptions(r: Ratings, order: readonly OptionId[] = OPTION_IDS): OptionFit[] {
  const important = importantValues(r);
  return order.map((optionId) => ({
    optionId,
    fits: important.filter((v) => OPTION_FIT[optionId][v] === "fits"),
    tension: important.filter((v) => OPTION_FIT[optionId][v] === "tension"),
    depends: important.filter((v) => OPTION_FIT[optionId][v] === "depends"),
  }));
}

/** SURE score: number of "yes" answers, 0 to 4. */
export function sureScore(a: SureAnswers): number {
  return SURE_ITEMS.reduce((n, i) => n + (a[i.key] ? 1 : 0), 0);
}

/** Anything under 4 of 4 suggests decisional conflict, so more support is offered (Légaré 2010). */
export function decisionalConflict(a: SureAnswers): boolean {
  return sureScore(a) < SURE_ITEMS.length;
}
