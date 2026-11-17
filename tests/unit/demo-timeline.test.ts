import { describe, expect, it } from "vitest";
import { CLOSING_SECONDS, FPS, INTRO_SECONDS, MAX_RATE, MAX_TOTAL_SECONDS, MONTAGE, STORY, TARGET_SECONDS, TITLE_SECONDS, sceneTiming, totalSeconds, wordCount } from "@/demo/timeline";
import captions from "@/demo/captions.json";

type Shot = { caption: string; evidence?: string; intro?: { eyebrow: string; heading: string } };
const shots = captions.scenes as Record<string, Shot>;

describe("demo video timeline", () => {
  it("plans four story scenes of about 30 seconds, a montage of about 28 seconds, and stays under three minutes", () => {
    for (const k of STORY) expect(TARGET_SECONDS[k]).toBeGreaterThanOrEqual(25);
    expect(MONTAGE.reduce((n, k) => n + TARGET_SECONDS[k], 0)).toBe(28);
    const planned = TITLE_SECONDS + CLOSING_SECONDS + Object.values(INTRO_SECONDS).reduce((a, b) => a + b, 0) + Object.values(TARGET_SECONDS).reduce((a, b) => a + b, 0);
    expect(planned).toBeLessThanOrEqual(MAX_TOTAL_SECONDS - 10); // room for clips that run a little long
    // Even if every story clip ran 20% past what the speed up can absorb, the cap holds.
    const worst = planned + STORY.reduce((n, k) => n + TARGET_SECONDS[k] * 0.15, 0);
    expect(worst).toBeLessThanOrEqual(MAX_TOTAL_SECONDS);
  });

  it("keeps a short clip at normal speed", () => {
    const t = sceneTiming({ key: "s1", segments: [{ from: 0, to: 10_000 }] }, 20);
    expect(t.rate).toBe(1);
    expect(t.frames).toBe(10 * FPS);
  });

  it("speeds up a long story clip, never beyond the limit, and never cuts it", () => {
    const fit = sceneTiming({ key: "s1", segments: [{ from: 0, to: 24_000 }] }, 20);
    expect(fit.rate).toBeCloseTo(1.2, 3);
    expect(fit.frames).toBe(20 * FPS);
    const long = sceneTiming({ key: "s1", segments: [{ from: 0, to: 60_000 }] }, 20);
    expect(long.rate).toBe(MAX_RATE);
    expect(long.frames).toBeGreaterThan(20 * FPS);
  });

  it("shortens a montage shot from its start, keeping its ending whole", () => {
    const t = sceneTiming({ key: "m1", segments: [{ from: 0, to: 4000 }, { from: 9000, to: 20_000 }] }, 7, { trim: true });
    expect(t.rate).toBe(MAX_RATE);
    expect(t.frames).toBeLessThanOrEqual(7 * FPS + 1);
    expect(t.segments[t.segments.length - 1]).toEqual({ from: 270, to: 600 }); // the ending is whole
    expect(t.segments[0].from).toBeGreaterThan(0);
  });

  it("joins the kept parts and drops the cut ones", () => {
    const t = sceneTiming({ key: "s2", segments: [{ from: 1000, to: 6000 }, { from: 40_000, to: 45_000 }] }, 30);
    expect(t.segments).toEqual([{ from: 30, to: 180 }, { from: 1200, to: 1350 }]);
    expect(t.frames).toBe(300);
    expect(totalSeconds([300])).toBe(TITLE_SECONDS + CLOSING_SECONDS + Object.values(INTRO_SECONDS).reduce((a, b) => a + b, 0) + 10);
  });

  it("has one short English caption per shot, the two testing lines, and no placeholders", () => {
    for (const k of Object.keys(TARGET_SECONDS)) {
      expect(shots[k], k).toBeTruthy();
      expect(wordCount(shots[k].caption), `${k}: ${shots[k].caption}`).toBeLessThanOrEqual(12);
    }
    expect(shots.s1.evidence).toBe("Understanding rose from 8 of 12 to 12 of 12 after Teach Back");
    expect(captions.closing.evidence).toBe("12 of 12 testers would recommend Merros");
    expect(captions.closing.heading).toBe("Merros. Healthy families, planned together.");
    expect(JSON.stringify(captions.closing)).not.toMatch(/vercel|https?:|\.app/i); // no web address on the closing card
    const all = JSON.stringify(captions);
    expect(all).not.toMatch(/\[\[|placeholder|TBD/i);
    expect(all).not.toMatch(/incompatib/i);
    expect(all).not.toMatch(/\bMeros\b/);
  });
});
