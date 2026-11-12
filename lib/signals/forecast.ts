/**
 * Counselling demand forecast (SPEC 7.2): damped trend exponential smoothing (Holt) on the weekly
 * series. It only ever sees the already privatised series, so it is post processing and costs no
 * privacy budget. Deterministic and unit tested; no AI model is involved.
 */
export interface Forecast {
  /** Point forecast for each future week, never negative. */
  mean: number[];
  /** Approximate 80% band. */
  low: number[];
  high: number[];
}

export const FORECAST_WEEKS = 8;
const ALPHA = 0.35;
const BETA = 0.15;
const PHI = 0.9;
/** A series needs this many published weeks, and at most this share of gaps, to be forecast. */
export const MIN_POINTS = 8;
export const MAX_GAP_SHARE = 0.3;

/** Fill suppressed weeks by linear interpolation between published neighbours (edges: nearest). */
export function fillGaps(series: (number | null)[]): number[] | null {
  const known = series.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  if (known.length < MIN_POINTS || (series.length - known.length) / series.length > MAX_GAP_SHARE) return null;
  return series.map((v, i) => {
    if (v !== null) return v;
    const before = known.filter((k) => k < i).pop();
    const after = known.find((k) => k > i);
    if (before === undefined) return series[after!]!;
    if (after === undefined) return series[before]!;
    const w = (i - before) / (after - before);
    return series[before]! * (1 - w) + series[after]! * w;
  });
}

export function forecast(series: (number | null)[], horizon = FORECAST_WEEKS): Forecast | null {
  const y = fillGaps(series);
  if (!y) return null;
  let level = y[0];
  let trend = y[1] - y[0];
  let sse = 0;
  let n = 0;
  for (let t = 1; t < y.length; t++) {
    const predicted = level + PHI * trend;
    const err = y[t] - predicted;
    if (t > 1) {
      sse += err * err;
      n++;
    }
    const newLevel = ALPHA * y[t] + (1 - ALPHA) * predicted;
    trend = BETA * (newLevel - level) + (1 - BETA) * PHI * trend;
    level = newLevel;
  }
  const rmse = Math.sqrt(sse / Math.max(n, 1));
  const mean: number[] = [];
  const low: number[] = [];
  const high: number[] = [];
  let damp = 0;
  for (let h = 1; h <= horizon; h++) {
    damp += Math.pow(PHI, h);
    const m = Math.max(0, level + damp * trend);
    const band = 1.2816 * rmse * Math.sqrt(h);
    mean.push(m);
    low.push(Math.max(0, m - band));
    high.push(m + band);
  }
  return { mean, low, high };
}
