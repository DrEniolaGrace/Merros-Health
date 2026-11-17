import { describe, expect, it } from "vitest";
import {
  CLOSING_SECONDS,
  FPS,
  INTRO_SECONDS,
  MAX_RATE,
  MAX_TOTAL_SECONDS,
  MAX_ZOOM,
  MONTAGE,
  SCREEN,
  STORY,
  TARGET_SECONDS,
  TITLE_SECONDS,
  cameraAt,
  frameRect,
  sceneTiming,
  sourceMs,
  totalSeconds,
  wordCount,
} from "@/demo/timeline";
import captions from "@/demo/captions.json";

type Shot = { caption: string; evidence?: string; intro?: { eyebrow: string; heading: string } };
const shots = captions.scenes as Record<string, Shot>;

describe("demo video timeline", () => {
  it("plans four story scenes of about 30 seconds, a 15 second montage, and stays under three minutes", () => {
    for (const k of STORY) expect(TARGET_SECONDS[k]).toBeGreaterThanOrEqual(25);
    expect(MONTAGE.reduce((n, k) => n + TARGET_SECONDS[k], 0)).toBe(15);
    const planned = TITLE_SECONDS + CLOSING_SECONDS + Object.values(INTRO_SECONDS).reduce((a, b) => a + b, 0) + Object.values(TARGET_SECONDS).reduce((a, b) => a + b, 0);
    expect(planned).toBeLessThanOrEqual(MAX_TOTAL_SECONDS - 15); // room for clips that run a little long
    // Even if every story clip ran 20% past what the speed up can absorb, the cap holds.
    const worst = planned + STORY.reduce((n, k) => n + TARGET_SECONDS[k] * 0.2, 0);
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

  it("trims a montage shot to its target", () => {
    const t = sceneTiming({ key: "m1", segments: [{ from: 0, to: 4000 }, { from: 9000, to: 15_000 }] }, 3.75, { trim: true });
    expect(t.frames).toBeLessThanOrEqual(Math.round(3.75 * FPS) + 1);
    expect(t.segments[0]).toEqual({ from: 0, to: 120 });
  });

  it("joins the kept parts, drops the cut ones, and maps played frames back to the recording", () => {
    const t = sceneTiming({ key: "s2", segments: [{ from: 1000, to: 6000 }, { from: 40_000, to: 45_000 }] }, 30);
    expect(t.segments).toEqual([{ from: 30, to: 180 }, { from: 1200, to: 1350 }]);
    expect(t.frames).toBe(300);
    expect(sourceMs(t.segments, t.rate, 0)).toBe(1000);
    expect(sourceMs(t.segments, t.rate, 150)).toBe(40_000);
    expect(totalSeconds([300])).toBe(TITLE_SECONDS + CLOSING_SECONDS + Object.values(INTRO_SECONDS).reduce((a, b) => a + b, 0) + 10);
  });

  it("the camera zooms in on the part that matters, never past the limit or off the screen", () => {
    const small = frameRect({ x: 100, y: 100, w: 200, h: 80 });
    expect(small.scale).toBe(MAX_ZOOM);
    expect(small.cx - SCREEN.w / 2 / small.scale).toBeGreaterThanOrEqual(0);
    expect(small.cy - SCREEN.h / 2 / small.scale).toBeGreaterThanOrEqual(0);
    const huge = frameRect({ x: 0, y: 0, w: 1900, h: 1000 });
    expect(huge.scale).toBe(1);
    expect(frameRect(null)).toEqual({ scale: 1, cx: SCREEN.w / 2, cy: SCREEN.h / 2 });
    const keys = [{ t: 1000, rect: { x: 600, y: 300, w: 600, h: 300 } }];
    expect(cameraAt(keys, 500).scale).toBe(1);
    expect(cameraAt(keys, 1100).scale).toBeGreaterThan(1);
    expect(cameraAt(keys, 1100).scale).toBeLessThan(frameRect(keys[0].rect).scale);
    expect(cameraAt(keys, 5000)).toEqual(frameRect(keys[0].rect));
  });

  it("has one short English caption per shot, the two testing lines, and no placeholders", () => {
    for (const k of Object.keys(TARGET_SECONDS)) {
      expect(shots[k], k).toBeTruthy();
      expect(wordCount(shots[k].caption), `${k}: ${shots[k].caption}`).toBeLessThanOrEqual(12);
    }
    expect(shots.s1.evidence).toBe("Understanding rose from 8 of 12 to 12 of 12 after Teach Back");
    expect(captions.closing.evidence).toBe("12 of 12 testers would recommend Merros");
    expect(captions.closing.heading).toBe("Merros. Healthy families, planned together.");
    const all = JSON.stringify(captions);
    expect(all).not.toMatch(/\[\[|placeholder|TBD/i);
    expect(all).not.toMatch(/incompatib/i);
    expect(all).not.toMatch(/\bMeros\b/);
  });
});
