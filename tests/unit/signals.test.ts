import { describe, expect, it } from "vitest";
import { budgetPeriod, canSpend, discreteLaplace, noiseScale, noiseSd, privatiseCount, reliableRate, safeRate, secureRng, seededRng, SUPPRESSION_THRESHOLD, totalEpsilon } from "@/lib/signals/dp";
import { fillGaps, forecast, FORECAST_WEEKS } from "@/lib/signals/forecast";
import { generateJourneys } from "@/lib/signals/synthetic";
import { computeRelease, medianBucket, monotone, PERIOD_BUDGET, regionShares, SIGNALS, type ReleaseData } from "@/lib/signals/release";
import { EVENT_KINDS, HISTORY_WEEKS, REGIONS, weekStart, type SignalEvent } from "@/lib/signals/events";

const NOW = new Date("2026-11-17T09:00:00Z");

describe("discrete Laplace mechanism", () => {
  it("always returns integers", () => {
    const rng = seededRng(1);
    for (let i = 0; i < 2000; i++) expect(Number.isInteger(discreteLaplace(3.3, rng))).toBe(true);
  });

  it("is centred on zero with the expected spread", () => {
    const rng = seededRng(7);
    const scale = 5;
    const n = 200_000;
    let sum = 0;
    let sq = 0;
    for (let i = 0; i < n; i++) {
      const x = discreteLaplace(scale, rng);
      sum += x;
      sq += x * x;
    }
    const mean = sum / n;
    const sd = Math.sqrt(sq / n - mean * mean);
    expect(Math.abs(mean)).toBeLessThan(0.08);
    expect(sd).toBeGreaterThan(noiseSd(scale) * 0.97);
    expect(sd).toBeLessThan(noiseSd(scale) * 1.03);
  });

  it("has the probability ratio that defines epsilon differential privacy", () => {
    // P(X = k) / P(X = k + 1) must equal exp(1 / scale) for k >= 0.
    const rng = seededRng(11);
    const scale = 2;
    const hist = new Map<number, number>();
    for (let i = 0; i < 400_000; i++) {
      const x = discreteLaplace(scale, rng);
      hist.set(x, (hist.get(x) ?? 0) + 1);
    }
    for (const k of [0, 1, 2, 3]) {
      expect(hist.get(k)! / hist.get(k + 1)!).toBeCloseTo(Math.exp(1 / scale), 1);
      expect(hist.get(-k)! / hist.get(-k - 1)!).toBeCloseTo(Math.exp(1 / scale), 1);
    }
  });

  it("is deterministic for a seed and different across seeds", () => {
    const a = Array.from({ length: 20 }, ((r) => () => discreteLaplace(4, r))(seededRng(5)));
    const b = Array.from({ length: 20 }, ((r) => () => discreteLaplace(4, r))(seededRng(5)));
    const c = Array.from({ length: 20 }, ((r) => () => discreteLaplace(4, r))(seededRng(6)));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("secure generator stays strictly inside (0, 1)", () => {
    for (let i = 0; i < 5000; i++) {
      const u = secureRng();
      expect(u).toBeGreaterThan(0);
      expect(u).toBeLessThan(1);
    }
  });

  it("rejects invalid parameters", () => {
    expect(() => noiseScale(0, 1)).toThrow();
    expect(() => noiseScale(1, 0)).toThrow();
    expect(() => discreteLaplace(0, seededRng(1))).toThrow();
    expect(() => privatiseCount(-1, 1, seededRng(1))).toThrow();
    expect(() => privatiseCount(1.5, 1, seededRng(1))).toThrow();
  });

  it("noise scale is sensitivity divided by epsilon", () => {
    expect(noiseScale(5, 0.5)).toBe(10);
  });
});

describe("suppression of small groups", () => {
  it("never publishes a value under the threshold", () => {
    const rng = seededRng(3);
    for (let t = 0; t < 40; t++) {
      for (let i = 0; i < 200; i++) {
        const c = privatiseCount(t, 2, rng);
        if (c !== null) expect(c).toBeGreaterThanOrEqual(SUPPRESSION_THRESHOLD);
      }
    }
  });

  it("a single person is practically never visible", () => {
    const rng = seededRng(4);
    let shown = 0;
    for (let i = 0; i < 20_000; i++) if (privatiseCount(1, 2, rng) !== null) shown++;
    expect(shown / 20_000).toBeLessThan(0.01);
  });

  it("rates are null when either part is suppressed, and clamped to 0..1 otherwise", () => {
    expect(safeRate(null, 50)).toBeNull();
    expect(safeRate(20, null)).toBeNull();
    expect(safeRate(30, 60)).toBe(0.5);
    expect(safeRate(70, 60)).toBe(1);
  });

  it("a rate is withheld when its denominator is small compared with the noise", () => {
    expect(reliableRate(81, 81, 14)).toBeNull();
    expect(reliableRate(40, null, 14)).toBeNull();
    expect(reliableRate(461, 563, 14)).toBeCloseTo(461 / 563, 9);
  });
});

describe("privacy budget", () => {
  it("a release costs the sum of its signals (sequential composition)", () => {
    expect(totalEpsilon(Object.values(SIGNALS))).toBe(2);
  });

  it("allows spending up to the budget and refuses beyond it", () => {
    expect(canSpend(0, 2, PERIOD_BUDGET)).toBe(true);
    expect(canSpend(4, 2, PERIOD_BUDGET)).toBe(true);
    expect(canSpend(4.5, 2, PERIOD_BUDGET)).toBe(false);
    expect(canSpend(6, 2, PERIOD_BUDGET)).toBe(false);
    expect(canSpend(0, 0, PERIOD_BUDGET)).toBe(false);
  });

  it("budget periods are calendar quarters", () => {
    expect(budgetPeriod(new Date("2026-11-17T00:00:00Z"))).toBe("2026-Q4");
    expect(budgetPeriod(new Date("2027-01-01T00:00:00Z"))).toBe("2027-Q1");
  });
});

describe("demand forecast", () => {
  it("continues a steady upward trend", () => {
    const series = Array.from({ length: 26 }, (_, i) => 20 + i);
    const f = forecast(series)!;
    expect(f.mean).toHaveLength(FORECAST_WEEKS);
    expect(f.mean[0]).toBeGreaterThan(44);
    expect(f.mean[0]).toBeLessThan(48);
    expect(f.mean[7]).toBeGreaterThan(f.mean[0]);
  });

  it("stays flat for a flat series and is never negative", () => {
    const flat = forecast(Array.from({ length: 20 }, () => 30))!;
    for (const m of flat.mean) expect(m).toBeCloseTo(30, 6);
    const falling = forecast(Array.from({ length: 20 }, (_, i) => Math.max(0, 19 - i)))!;
    for (const m of falling.mean) expect(m).toBeGreaterThanOrEqual(0);
    for (const l of falling.low) expect(l).toBeGreaterThanOrEqual(0);
  });

  it("the band widens with the horizon and contains the mean", () => {
    const noisy = Array.from({ length: 26 }, (_, i) => 30 + i * 0.5 + (i % 2 ? 3 : -3));
    const f = forecast(noisy)!;
    for (let h = 0; h < FORECAST_WEEKS; h++) {
      expect(f.low[h]).toBeLessThanOrEqual(f.mean[h]);
      expect(f.high[h]).toBeGreaterThanOrEqual(f.mean[h]);
    }
    expect(f.high[7] - f.low[7]).toBeGreaterThan(f.high[0] - f.low[0]);
  });

  it("interpolates a few suppressed weeks", () => {
    expect(fillGaps([10, null, 14, 16, 18, 20, 22, 24, 26, 28])).toEqual([10, 12, 14, 16, 18, 20, 22, 24, 26, 28]);
    expect(fillGaps([null, 12, 14, 16, 18, 20, 22, 24, 26, null])![0]).toBe(12);
  });

  it("refuses to forecast when too much of the series is suppressed", () => {
    const sparse = Array.from({ length: 26 }, (_, i) => (i % 2 ? 12 : null));
    expect(forecast(sparse)).toBeNull();
    expect(forecast([12, 13, 14])).toBeNull();
  });
});

describe("synthetic journeys", () => {
  const events = generateJourneys(NOW);

  it("creates 2,000 journeys inside the 26 week window, deterministically", () => {
    expect(new Set(events.map((e) => e.journey)).size).toBe(2000);
    const end = weekStart(NOW).getTime();
    for (const e of events) {
      expect(e.at.getTime()).toBeLessThan(end);
      expect(EVENT_KINDS).toContain(e.kind);
      expect(REGIONS).toContain(e.region);
    }
    expect(generateJourneys(NOW)).toEqual(events);
  });

  it("carries no identity field of any kind", () => {
    for (const e of events.slice(0, 500)) expect(Object.keys(e).sort()).toEqual(["at", "journey", "kind", "language", "readingLevel", "region", "value"]);
  });
});

describe("release", () => {
  const events = generateJourneys(NOW);
  const { data, ledger, epsilon } = computeRelease(events, NOW, seededRng(42));

  const cells = (d: ReleaseData): (number | null)[] => [
    ...REGIONS.flatMap((r) => [...Object.values(d.funnel[r]), ...d.wait[r]]),
    ...d.weekly,
    ...d.comprehension.flatMap((c) => [c.total, c.passedFirst]),
    ...Object.values(d.wellbeing),
    ...Object.values(d.copilot),
    ...Object.values(d.outreach),
  ];

  it("charges every signal to the ledger and totals 2.0", () => {
    expect(ledger.map((l) => l.signal).sort()).toEqual(Object.keys(SIGNALS).sort());
    expect(epsilon).toBe(2);
  });

  it("publishes only integers at or above the threshold, or nothing", () => {
    for (const c of cells(data)) {
      if (c === null) continue;
      expect(Number.isInteger(c)).toBe(true);
      expect(c).toBeGreaterThanOrEqual(SUPPRESSION_THRESHOLD);
    }
  });

  it("has 26 programme wide weeks", () => {
    expect(data.weeks).toHaveLength(HISTORY_WEEKS);
    expect(data.weekly).toHaveLength(HISTORY_WEEKS);
    expect(data.weekly.filter((c) => c !== null).length).toBeGreaterThan(20);
  });

  it("a published funnel only narrows", () => {
    expect(monotone([100, 120, null, 90, 95])).toEqual([100, 100, null, 90, 90]);
    for (const r of REGIONS) {
      const steps = Object.values(data.funnel[r]).filter((c): c is number => c !== null);
      for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeLessThanOrEqual(steps[i - 1]);
    }
  });

  it("regional shares come from published cells and sum to 1", () => {
    const shares = regionShares(data.funnel);
    const known = Object.values(shares).filter((x): x is number => x !== null);
    expect(known.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    const hidden = { ...data.funnel, al_dhafra: { ...data.funnel.al_dhafra, counselling_booked: null } };
    expect(regionShares(hidden).al_dhafra).toBeNull();
  });

  it("stays close to the truth for large groups", () => {
    const received = new Set(events.filter((e) => e.kind === "result_received" && e.region === "abu_dhabi").map((e) => e.journey)).size;
    expect(Math.abs(data.funnel.abu_dhabi.result_received! - received)).toBeLessThan(90);
  });

  it("differs between two releases of the same data (fresh noise each time)", () => {
    const other = computeRelease(events, NOW, seededRng(43)).data;
    expect(cells(other)).not.toEqual(cells(data));
  });

  it("one extra journey moves each signal by no more than its declared sensitivity (zero noise check)", () => {
    // With the noise switched off, compare the store with and without one maximal journey.
    const noNoise = () => 0.5; // geometric(0.5 draw) cancels: both draws equal, so noise is exactly 0
    const extra: SignalEvent[] = EVENT_KINDS.flatMap((kind) =>
      Array.from({ length: kind.startsWith("copilot") ? 9 : 1 }, () => ({ journey: "extra", kind, region: "abu_dhabi" as const, language: "ar" as const, readingLevel: "simple" as const, value: kind === "counselling_booked" ? 2 : 1, at: new Date(weekStart(NOW).getTime() - 3 * 86_400_000) })),
    );
    const base = computeRelease(events, NOW, noNoise).data;
    const plus = computeRelease([...events, ...extra], NOW, noNoise).data;
    const diff = (a: (number | null)[], b: (number | null)[]) => a.reduce<number>((s, v, i) => s + Math.abs((b[i] ?? 0) - (v ?? 0)), 0);
    // Only compare cells published in both, so suppression does not blur the check.
    const l1 = (pick: (d: ReleaseData) => (number | null)[]) => {
      const a = pick(base);
      const b = pick(plus);
      const keep = a.map((v, i) => v !== null && b[i] !== null);
      return diff(a.filter((_, i) => keep[i]), b.filter((_, i) => keep[i]));
    };
    expect(l1((d) => REGIONS.flatMap((r) => Object.values(d.funnel[r])))).toBeLessThanOrEqual(SIGNALS.funnel.sensitivity);
    expect(l1((d) => REGIONS.flatMap((r) => d.wait[r]))).toBeLessThanOrEqual(SIGNALS.wait.sensitivity);
    expect(l1((d) => d.weekly)).toBeLessThanOrEqual(SIGNALS.weekly.sensitivity);
    expect(l1((d) => d.comprehension.flatMap((c) => [c.total, c.passedFirst]))).toBeLessThanOrEqual(SIGNALS.comprehension.sensitivity);
    expect(l1((d) => Object.values(d.wellbeing))).toBeLessThanOrEqual(SIGNALS.wellbeing.sensitivity);
    expect(l1((d) => Object.values(d.copilot))).toBe(SIGNALS.copilot.sensitivity);
    expect(l1((d) => Object.values(d.outreach))).toBeLessThanOrEqual(SIGNALS.outreach.sensitivity);
  });

  it("finds the median waiting bucket only from published cells", () => {
    expect(medianBucket([40, 30, 20, 10])).toBe(1);
    expect(medianBucket([10, 10, 10, 70])).toBe(3);
    expect(medianBucket([40, null, 20, 10])).toBeNull();
  });
});
