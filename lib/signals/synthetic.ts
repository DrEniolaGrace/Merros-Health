/**
 * About 2,000 SYNTHETIC anonymous journeys so the dashboard has realistic data on day one
 * (SPEC 11A). Every rate below is invented for the prototype and is not an observation about any
 * real population. Deterministic for a given seed and date.
 */
import { seededRng } from "./dp";
import { HISTORY_WEEKS, WEEK_MS, weekStart, type EventKind, type Language, type Level, type Region, type SignalEvent } from "./events";

const DAY = 86_400_000;

const REGION_WEIGHTS: [Region, number][] = [["abu_dhabi", 0.58], ["al_ain", 0.29], ["al_dhafra", 0.13]];
const LEVEL_WEIGHTS: [Level, number][] = [["simple", 0.3], ["standard", 0.5], ["detailed", 0.2]];
/** Mean days from offer to booked session. The further region waits longer in this invented data. */
const MEAN_WAIT: Record<Region, number> = { abu_dhabi: 4, al_ain: 6.5, al_dhafra: 11 };
const PASS_FIRST: Record<Level, number> = { simple: 0.64, standard: 0.79, detailed: 0.87 };

function pick<T>(weights: [T, number][], u: number): T {
  let acc = 0;
  for (const [v, w] of weights) {
    acc += w;
    if (u < acc) return v;
  }
  return weights[weights.length - 1][0];
}

export function generateJourneys(now: Date, count = 2000, seed = 20261117): SignalEvent[] {
  const rng = seededRng(seed);
  const end = weekStart(now).getTime(); // history is the 26 complete weeks before this week
  const start = end - HISTORY_WEEKS * WEEK_MS;
  // Volume grows over the period, so the forecast has a trend to follow.
  const weekWeights: [number, number][] = Array.from({ length: HISTORY_WEEKS }, (_, w) => [w, 1 + (0.9 * w) / (HISTORY_WEEKS - 1)]);
  const totalW = weekWeights.reduce((s, [, w]) => s + w, 0);
  const normWeeks = weekWeights.map(([w, x]) => [w, x / totalW] as [number, number]);

  const events: SignalEvent[] = [];
  for (let i = 0; i < count; i++) {
    const journey = `syn-${i}`;
    const region = pick(REGION_WEIGHTS, rng());
    const language: Language = rng() < 0.68 ? "ar" : "en";
    const readingLevel = pick(LEVEL_WEIGHTS, rng());
    const t0 = start + pick(normWeeks, rng()) * WEEK_MS + Math.floor(rng() * 7 * DAY);
    const add = (kind: EventKind, at: number, value: number | null = null) => {
      if (at < end) events.push({ journey, kind, region, language, readingLevel, value, at: new Date(at) });
      return at < end;
    };

    add("result_received", t0);

    if (rng() < 0.7) {
      const questions = 1 + Math.floor(rng() * 6);
      for (let q = 0; q < questions; q++) {
        const at = t0 + Math.floor(rng() * 3 * DAY);
        add("copilot_question", at);
        if (rng() < 0.035) add("copilot_blocked", at);
      }
    }

    if (rng() < 0.88) {
      // Invented gap: Arabic speakers at the simple level understand less often on the first try.
      const p = PASS_FIRST[readingLevel] - (language === "ar" && readingLevel === "simple" ? 0.08 : 0);
      add("teachback_first", t0 + DAY, rng() < p ? 1 : 0);
      if (rng() < 0.93) add("understood", t0 + DAY + Math.floor(rng() * DAY));
    }

    if (rng() < 0.48) {
      const offered = t0 + Math.floor(rng() * 2 * DAY);
      add("counselling_offered", offered);
      if (rng() < 0.82) {
        const wait = Math.max(0, Math.round(-Math.log(rng()) * MEAN_WAIT[region]));
        const booked = offered + wait * DAY;
        if (add("counselling_booked", booked, wait) && rng() < 0.86) {
          const done = booked + Math.floor(rng() * 2 * DAY);
          if (add("counselling_completed", done)) {
            add("sure_pre", booked, rng() < 0.38 ? 1 : 0);
            add("sure_post", done, rng() < 0.71 ? 1 : 0);
            add("distress_pre", booked, rng() < 0.46 ? 1 : 0);
            add("distress_post", done, rng() < 0.24 ? 1 : 0);
          }
        }
      }
    }

    if (rng() < 0.22) {
      const at = t0 + Math.floor(rng() * 10 * DAY);
      add("invite_created", at);
      if (rng() < 0.6) {
        add("invite_opened", at + 2 * DAY);
        if (rng() < 0.45) add("relative_tested", at + 20 * DAY);
      }
    }

    if (rng() < 0.022) add("reclass_affected", t0 + Math.floor(rng() * 60 * DAY));
  }
  return events;
}
