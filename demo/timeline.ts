/**
 * Turns the recorded clips into a timeline of about three minutes. Pure, unit tested.
 * Each scene has a target length; a clip longer than its target is played a little faster (at
 * most 1.5 times), never cut, so nothing important is lost. Shorter clips keep their own length.
 */
export const FPS = 30;
export const MAX_RATE = 1.5;
export const TITLE_SECONDS = 9;
export const CLOSING_SECONDS = 11;

/** Target seconds per scene, adding up to about three minutes with the two cards. */
export const TARGET_SECONDS: Record<string, number> = { s1: 26, s2: 24, s3: 22, s4: 19, s5: 18, s6: 15, s7: 16, s8: 16 };

export interface ClipInfo {
  key: string;
  /** Kept parts in milliseconds from the start of the recording. */
  segments: { from: number; to: number }[];
}

export function sceneTiming(clip: ClipInfo, targetSeconds: number) {
  const segments = clip.segments
    .map((s) => ({ from: Math.max(0, Math.round((s.from / 1000) * FPS)), to: Math.round((s.to / 1000) * FPS) }))
    .filter((s) => s.to - s.from >= 3);
  const kept = segments.reduce((n, s) => n + (s.to - s.from), 0);
  const target = targetSeconds * FPS;
  const rate = kept > target ? Math.min(MAX_RATE, kept / target) : 1;
  const frames = segments.reduce((n, s) => n + Math.max(1, Math.round((s.to - s.from) / rate)), 0);
  return { segments, rate: Math.round(rate * 1000) / 1000, frames, keptSeconds: kept / FPS };
}

export function totalSeconds(sceneFrames: number[]) {
  return (TITLE_SECONDS * FPS + CLOSING_SECONDS * FPS + sceneFrames.reduce((a, b) => a + b, 0)) / FPS;
}
