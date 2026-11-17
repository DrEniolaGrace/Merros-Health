/**
 * Turns the recorded clips into a timeline of under three minutes. Pure, unit tested.
 *
 * One couple, one story: four scenes of about 30 seconds, then a montage of four shots of about
 * seven seconds each. The whole app is always shown, never zoomed. A clip longer than its target plays a little faster (at most MAX_RATE). Story scenes are
 * never cut; a montage shot is shortened from its start so the montage keeps its length and each
 * shot still ends on what it was recorded to show (the answer, the result).
 */
export const FPS = 30;
export const MAX_RATE = 1.6;
export const TITLE_SECONDS = 7;
export const CLOSING_SECONDS = 9;
/** The video must never run longer than this. */
export const MAX_TOTAL_SECONDS = 180;

export const STORY = ["s1", "s2", "s3", "s4"] as const;
export const MONTAGE = ["m1", "m2", "m3", "m4"] as const;

/** Target seconds of footage per clip. */
export const TARGET_SECONDS: Record<string, number> = { s1: 30, s2: 30, s3: 28, s4: 25, m1: 7, m2: 7, m3: 7, m4: 7 };

/** A short card before the footage (scene 4 opens "One year later"). */
export const INTRO_SECONDS: Record<string, number> = { s4: 3 };

export interface ClipInfo {
  key: string;
  /** Kept parts in milliseconds from the start of the recording. */
  segments: { from: number; to: number }[];
}

export function sceneTiming(clip: ClipInfo, targetSeconds: number, opts: { trim?: boolean } = {}) {
  let segments = clip.segments
    .map((s) => ({ from: Math.max(0, Math.round((s.from / 1000) * FPS)), to: Math.round((s.to / 1000) * FPS) }))
    .filter((s) => s.to - s.from >= 3);
  const kept = segments.reduce((n, s) => n + (s.to - s.from), 0);
  const target = Math.round(targetSeconds * FPS);
  const rate = kept > target ? Math.min(MAX_RATE, kept / target) : 1;
  if (opts.trim) {
    // Keep only as much source as fits the target at this rate: the last parts whole, the lead-up shortened.
    let budget = Math.round(target * rate);
    segments = segments
      .slice()
      .reverse()
      .flatMap((s) => {
        if (budget <= 0) return [];
        const len = Math.min(s.to - s.from, budget);
        budget -= len;
        return [{ from: s.to - len, to: s.to }];
      })
      .reverse()
      .filter((s) => s.to - s.from >= 3);
  }
  const frames = segments.reduce((n, s) => n + Math.max(1, Math.round((s.to - s.from) / rate)), 0);
  return { segments, rate: Math.round(rate * 1000) / 1000, frames, keptSeconds: kept / FPS };
}

export function totalSeconds(sceneFrames: number[]) {
  const intros = Object.values(INTRO_SECONDS).reduce((a, b) => a + b, 0) * FPS;
  return (TITLE_SECONDS * FPS + CLOSING_SECONDS * FPS + intros + sceneFrames.reduce((a, b) => a + b, 0)) / FPS;
}

/** The recording size (the app is shown whole, scaled to its window). */
export const SCREEN = { w: 1920, h: 1080 };

/** Words in a caption line (numbers count as words). */
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
