/**
 * Builds one differentially private release from the aggregate store. Pure: events in, noised
 * statistics and a ledger out. The true counts never leave this function.
 */
import { noiseScale, noiseSd, privatiseCount, totalEpsilon, type Cell, type LedgerEntry, type Rng } from "./dp";
import {
  FUNNEL_STEPS,
  HISTORY_WEEKS,
  LANGUAGES,
  LEVELS,
  REGIONS,
  WAIT_BUCKETS,
  WEEK_MS,
  weekStart,
  type EventKind,
  type FunnelStep,
  type Language,
  type Level,
  type Region,
  type SignalEvent,
} from "./events";

/** Epsilon available per budget period (calendar quarter). */
export const PERIOD_BUDGET = 6;

/** Bounds on what one journey may contribute, applied before counting. */
export const MAX_QUESTIONS = 3;
export const MAX_BLOCKS = 2;

/**
 * The signals of a release. `sensitivity` is the largest total change one journey can make
 * across every cell of that signal, given the bounds above and one cell group per journey.
 */
export const SIGNALS = {
  funnel: { sensitivity: FUNNEL_STEPS.length, epsilon: 0.5 },
  wait: { sensitivity: 1, epsilon: 0.2 },
  weekly: { sensitivity: 1, epsilon: 0.4 },
  comprehension: { sensitivity: 2, epsilon: 0.2 },
  wellbeing: { sensitivity: 5, epsilon: 0.25 },
  copilot: { sensitivity: MAX_QUESTIONS + MAX_BLOCKS, epsilon: 0.25 },
  outreach: { sensitivity: 4, epsilon: 0.2 },
} as const;
export type SignalKey = keyof typeof SIGNALS;

export interface ReleaseData {
  version: 1;
  generatedAt: string;
  /** ISO dates of the Monday of each published week, oldest first. */
  weeks: string[];
  funnel: Record<Region, Record<FunnelStep, Cell>>;
  wait: Record<Region, Cell[]>;
  /** Booked sessions per week across the whole programme (regional weeks are too small to publish). */
  weekly: Cell[];
  comprehension: { language: Language; level: Level; total: Cell; passedFirst: Cell }[];
  wellbeing: { n: Cell; surePre: Cell; surePost: Cell; distressPre: Cell; distressPost: Cell };
  copilot: { questions: Cell; blocked: Cell };
  outreach: { inviteCreated: Cell; inviteOpened: Cell; relativeTested: Cell; reclassAffected: Cell };
  /** Typical size of the noise added to each cell of a signal (one standard deviation). */
  noiseSd: Record<SignalKey, number>;
}

interface Journey {
  region: Region;
  language: Language;
  level: Level;
  has: Set<EventKind>;
  values: Partial<Record<EventKind, number>>;
  counts: Partial<Record<EventKind, number>>;
  bookedAt: Date | null;
}

/** One summary per journey, so each journey lands in exactly one region, language and level. */
function summarise(events: SignalEvent[]): Journey[] {
  const map = new Map<string, Journey>();
  const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const e of sorted) {
    let j = map.get(e.journey);
    if (!j) {
      j = { region: e.region, language: e.language, level: e.readingLevel, has: new Set(), values: {}, counts: {}, bookedAt: null };
      map.set(e.journey, j);
    }
    if (!j.has.has(e.kind) && e.value !== null) j.values[e.kind] = e.value;
    j.has.add(e.kind);
    j.counts[e.kind] = (j.counts[e.kind] ?? 0) + 1;
    if (e.kind === "counselling_booked" && !j.bookedAt) j.bookedAt = e.at;
  }
  return [...map.values()];
}

export function computeRelease(events: SignalEvent[], now: Date, rng: Rng): { data: ReleaseData; ledger: LedgerEntry[]; epsilon: number } {
  const end = weekStart(now).getTime();
  const start = end - HISTORY_WEEKS * WEEK_MS;
  const journeys = summarise(events.filter((e) => e.at.getTime() >= start && e.at.getTime() < end));
  const scale = (k: SignalKey) => noiseScale(SIGNALS[k].sensitivity, SIGNALS[k].epsilon);
  const noisy = (k: SignalKey, trueCount: number) => privatiseCount(trueCount, scale(k), rng);
  const count = (pred: (j: Journey) => boolean) => journeys.reduce((n, j) => n + (pred(j) ? 1 : 0), 0);
  const sum = (f: (j: Journey) => number) => journeys.reduce((n, j) => n + f(j), 0);

  const funnel = Object.fromEntries(
    REGIONS.map((r) => {
      const steps = monotone(FUNNEL_STEPS.map((s) => noisy("funnel", count((j) => j.region === r && j.has.has(s)))));
      return [r, Object.fromEntries(FUNNEL_STEPS.map((s, i) => [s, steps[i]]))];
    }),
  ) as ReleaseData["funnel"];

  const bucketOf = (days: number) => WAIT_BUCKETS.findIndex((b) => days <= b.max);
  const wait = Object.fromEntries(
    REGIONS.map((r) => [
      r,
      WAIT_BUCKETS.map((_, i) => noisy("wait", count((j) => j.region === r && j.values.counselling_booked !== undefined && bucketOf(j.values.counselling_booked) === i))),
    ]),
  ) as ReleaseData["wait"];

  const weekIndex = (d: Date) => Math.floor((d.getTime() - start) / WEEK_MS);
  const weekly = Array.from({ length: HISTORY_WEEKS }, (_, w) => noisy("weekly", count((j) => j.bookedAt !== null && weekIndex(j.bookedAt) === w)));

  const comprehension = LANGUAGES.flatMap((language) =>
    LEVELS.map((level) => {
      const inCell = (j: Journey) => j.language === language && j.level === level && j.has.has("teachback_first");
      return { language, level, total: noisy("comprehension", count(inCell)), passedFirst: noisy("comprehension", count((j) => inCell(j) && j.values.teachback_first === 1)) };
    }),
  );

  const both = (j: Journey) => j.has.has("sure_pre") && j.has.has("sure_post") && j.has.has("distress_pre") && j.has.has("distress_post");
  const wellbeing = {
    n: noisy("wellbeing", count(both)),
    surePre: noisy("wellbeing", count((j) => both(j) && j.values.sure_pre === 1)),
    surePost: noisy("wellbeing", count((j) => both(j) && j.values.sure_post === 1)),
    distressPre: noisy("wellbeing", count((j) => both(j) && j.values.distress_pre === 1)),
    distressPost: noisy("wellbeing", count((j) => both(j) && j.values.distress_post === 1)),
  };

  const copilot = {
    questions: noisy("copilot", sum((j) => Math.min(j.counts.copilot_question ?? 0, MAX_QUESTIONS))),
    blocked: noisy("copilot", sum((j) => Math.min(j.counts.copilot_blocked ?? 0, MAX_BLOCKS))),
  };

  const outreach = {
    inviteCreated: noisy("outreach", count((j) => j.has.has("invite_created"))),
    inviteOpened: noisy("outreach", count((j) => j.has.has("invite_opened"))),
    relativeTested: noisy("outreach", count((j) => j.has.has("relative_tested"))),
    reclassAffected: noisy("outreach", count((j) => j.has.has("reclass_affected"))),
  };

  const keys = Object.keys(SIGNALS) as SignalKey[];
  const ledger: LedgerEntry[] = keys.map((k) => ({ signal: k, mechanism: "discrete_laplace", sensitivity: SIGNALS[k].sensitivity, epsilon: SIGNALS[k].epsilon }));
  const data: ReleaseData = {
    version: 1,
    generatedAt: now.toISOString(),
    weeks: Array.from({ length: HISTORY_WEEKS }, (_, w) => new Date(start + w * WEEK_MS).toISOString().slice(0, 10)),
    funnel,
    wait,
    weekly,
    comprehension,
    wellbeing,
    copilot,
    outreach,
    noiseSd: Object.fromEntries(keys.map((k) => [k, Math.round(noiseSd(scale(k)) * 10) / 10])) as Record<SignalKey, number>,
  };
  return { data, ledger, epsilon: totalEpsilon(ledger) };
}

/**
 * A funnel can only narrow. Noise can break that, so each published step is capped at the step
 * before it. This uses published values only (post processing), so it costs no privacy.
 */
export function monotone(cells: Cell[]): Cell[] {
  let cap = Infinity;
  return cells.map((c) => {
    if (c === null) return null;
    cap = Math.min(cap, c);
    return cap;
  });
}

/**
 * Share of booked sessions per region, from the published funnel. Used to split the programme
 * forecast by region without spending more budget. Null for a region whose cell is suppressed.
 */
export function regionShares(funnel: ReleaseData["funnel"]): Record<Region, number | null> {
  const booked = REGIONS.map((r) => funnel[r].counselling_booked);
  const total = booked.reduce<number>((s, c) => s + (c ?? 0), 0);
  return Object.fromEntries(REGIONS.map((r, i) => [r, booked[i] === null || total <= 0 ? null : (booked[i] as number) / total])) as Record<Region, number | null>;
}

/** Index of the bucket holding the median, from published cells only; null if any is suppressed. */
export function medianBucket(cells: Cell[]): number | null {
  if (cells.some((c) => c === null)) return null;
  const total = cells.reduce<number>((s, c) => s + (c as number), 0);
  let acc = 0;
  for (let i = 0; i < cells.length; i++) {
    acc += cells[i] as number;
    if (acc >= total / 2) return i;
  }
  return cells.length - 1;
}
