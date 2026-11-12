/**
 * Differential privacy primitives for the Population Signals Dashboard (SPEC 7.2).
 *
 * Privacy unit: one journey (one person). Every published statistic is a COUNT of journeys.
 * A "signal" is a group of count cells; its L1 sensitivity is the largest total change one journey
 * can cause across all of its cells (contributions are bounded before counting). Each cell gets
 * discrete Laplace noise with scale b = sensitivity / epsilon, which gives epsilon differential
 * privacy for the whole signal. Signals compose sequentially, so a release costs the sum of the
 * epsilons, and that sum is charged to a per period budget.
 *
 * Cells whose NOISY value is under the threshold are suppressed. Thresholding the noisy value is
 * post processing, so it costs no extra privacy; thresholding the true value would leak.
 *
 * Noise is integer valued (difference of two geometric variables), so no floating point noise
 * value is ever published. See docs/PRIVACY_AND_DATA_GOVERNANCE.md for limits of this prototype.
 */

/** Uniform random number in the open interval (0, 1). */
export type Rng = () => number;

/** Cryptographically secure uniform in (0, 1), 53 bits. Used for every real release. */
export const secureRng: Rng = () => {
  const a = new Uint32Array(2);
  for (;;) {
    globalThis.crypto.getRandomValues(a);
    const v = ((a[0] >>> 5) * 67108864 + (a[1] >>> 6)) / 9007199254740992;
    if (v > 0) return v;
  }
};

/** Deterministic generator for tests and for the seeded demo release (mulberry32). */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const v = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return v > 0 ? v : 1 / 4294967296;
  };
}

/** Noise scale b for a signal. */
export function noiseScale(sensitivity: number, epsilon: number): number {
  if (!(sensitivity > 0) || !(epsilon > 0)) throw new Error("sensitivity and epsilon must be positive");
  return sensitivity / epsilon;
}

/** Geometric variable on 0, 1, 2, ... with P(G = k) = (1 - q) q^k. */
function geometric(q: number, rng: Rng): number {
  return Math.floor(Math.log(rng()) / Math.log(q));
}

/** Discrete Laplace noise: P(X = k) proportional to exp(-|k| / scale). Always an integer. */
export function discreteLaplace(scale: number, rng: Rng): number {
  if (!(scale > 0)) throw new Error("scale must be positive");
  const q = Math.exp(-1 / scale);
  return geometric(q, rng) - geometric(q, rng);
}

/** Standard deviation of discrete Laplace noise with this scale. */
export function noiseSd(scale: number): number {
  const q = Math.exp(-1 / scale);
  return Math.sqrt(2 * q) / (1 - q);
}

/** Groups smaller than this are never published (SPEC 7.2). */
export const SUPPRESSION_THRESHOLD = 10;

/** A published cell: a noisy count, or null when suppressed. Never the true count. */
export type Cell = number | null;

export function privatiseCount(trueCount: number, scale: number, rng: Rng, threshold = SUPPRESSION_THRESHOLD): Cell {
  if (!Number.isInteger(trueCount) || trueCount < 0) throw new Error("count must be a non negative integer");
  const noisy = trueCount + discreteLaplace(scale, rng);
  return noisy < threshold ? null : noisy;
}

/** Ratio of two published cells, or null if either is suppressed. Post processing only. */
export function safeRate(numerator: Cell, denominator: Cell): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return Math.min(1, Math.max(0, numerator / denominator));
}

/**
 * A ratio is only worth showing when its denominator is large compared with the noise; otherwise
 * the percentage mostly reflects the noise. Returns null when it is not reliable enough.
 */
export const RELIABLE_MULTIPLE = 8;
export function reliableRate(numerator: Cell, denominator: Cell, sd: number): number | null {
  if (denominator === null || denominator < RELIABLE_MULTIPLE * sd) return null;
  return safeRate(numerator, denominator);
}

export interface LedgerEntry {
  signal: string;
  mechanism: "discrete_laplace";
  sensitivity: number;
  epsilon: number;
}

/** Sequential composition: the cost of a release is the sum of the epsilons of its signals. */
export function totalEpsilon(entries: { epsilon: number }[]): number {
  return Math.round(entries.reduce((s, e) => s + e.epsilon, 0) * 1e6) / 1e6;
}

/** True only if the whole release fits in what is left of the period budget. */
export function canSpend(spent: number, cost: number, budget: number): boolean {
  return cost > 0 && spent + cost <= budget + 1e-9;
}

/** Budget period: the calendar quarter, for example "2026-Q4". */
export function budgetPeriod(d: Date): string {
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}
