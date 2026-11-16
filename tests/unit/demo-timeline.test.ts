import { describe, expect, it } from "vitest";
import { CLOSING_SECONDS, FPS, MAX_RATE, TARGET_SECONDS, TITLE_SECONDS, sceneTiming, totalSeconds } from "@/demo/timeline";
import captions from "@/demo/captions.json";

describe("demo video timeline", () => {
  it("adds up to about three minutes", () => {
    const planned = TITLE_SECONDS + CLOSING_SECONDS + Object.values(TARGET_SECONDS).reduce((a, b) => a + b, 0);
    expect(planned).toBeGreaterThanOrEqual(170);
    expect(planned).toBeLessThanOrEqual(190);
  });

  it("keeps a short clip at normal speed", () => {
    const t = sceneTiming({ key: "s1", segments: [{ from: 0, to: 10_000 }] }, 20);
    expect(t.rate).toBe(1);
    expect(t.frames).toBe(10 * FPS);
  });

  it("speeds up a long clip, never beyond the limit, and never cuts it", () => {
    const fit = sceneTiming({ key: "s1", segments: [{ from: 0, to: 24_000 }] }, 20);
    expect(fit.rate).toBeCloseTo(1.2, 3); // under the cap
    expect(fit.frames).toBe(20 * FPS);
    const long = sceneTiming({ key: "s1", segments: [{ from: 0, to: 60_000 }] }, 20);
    expect(long.rate).toBe(MAX_RATE);
    expect(long.frames).toBeGreaterThan(20 * FPS);
  });

  it("joins the kept parts and drops the cut ones", () => {
    const t = sceneTiming({ key: "s2", segments: [{ from: 1000, to: 6000 }, { from: 40_000, to: 45_000 }] }, 30);
    expect(t.segments).toEqual([{ from: 30, to: 180 }, { from: 1200, to: 1350 }]);
    expect(t.frames).toBe(300);
    expect(totalSeconds([300])).toBe(TITLE_SECONDS + CLOSING_SECONDS + 10);
  });

  it("has captions in both languages for every scene, and only known placeholders", () => {
    const keys = Object.keys(captions.placeholders);
    for (const k of Object.keys(TARGET_SECONDS)) {
      const c = (captions.scenes as Record<string, { title: { en: string; ar: string }; text: { en: string; ar: string } }>)[k];
      expect(c, k).toBeTruthy();
      expect(c.text.ar).toMatch(/[؀-ۿ]/);
    }
    for (const m of JSON.stringify({ ...captions, _about: "" }).matchAll(/\[\[([A-Z_]+)\]\]/g)) expect(keys).toContain(m[1]);
    expect(JSON.stringify(captions)).not.toMatch(/incompatib/i);
  });
});
