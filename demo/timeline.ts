/**
 * Turns the recorded clips into a timeline of under three minutes. Pure, unit tested.
 *
 * One couple, one story: four scenes of about 30 seconds, then a 15 second montage of four short
 * shots. A clip longer than its target plays a little faster (at most MAX_RATE). Story scenes are
 * never cut; a montage shot is trimmed at the end so the montage stays at 15 seconds.
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
export const TARGET_SECONDS: Record<string, number> = { s1: 30, s2: 30, s3: 30, s4: 27, m1: 3.75, m2: 3.75, m3: 3.75, m4: 3.75 };

/** A short card before the footage (scene 4 opens "One year later"). */
export const INTRO_SECONDS: Record<string, number> = { s4: 3 };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** From `t` (ms since the recording started) the camera frames `rect`, or the whole screen. */
export interface CameraKey {
  t: number;
  rect: Rect | null;
}

export interface ClipInfo {
  key: string;
  /** Kept parts in milliseconds from the start of the recording. */
  segments: { from: number; to: number }[];
  camera?: CameraKey[];
}

export function sceneTiming(clip: ClipInfo, targetSeconds: number, opts: { trim?: boolean } = {}) {
  let segments = clip.segments
    .map((s) => ({ from: Math.max(0, Math.round((s.from / 1000) * FPS)), to: Math.round((s.to / 1000) * FPS) }))
    .filter((s) => s.to - s.from >= 3);
  const kept = segments.reduce((n, s) => n + (s.to - s.from), 0);
  const target = Math.round(targetSeconds * FPS);
  const rate = kept > target ? Math.min(MAX_RATE, kept / target) : 1;
  if (opts.trim) {
    // Keep only as much source as fits the target at this rate, cutting from the end.
    let budget = Math.round(target * rate);
    segments = segments.flatMap((s) => {
      if (budget <= 0) return [];
      const len = Math.min(s.to - s.from, budget);
      budget -= len;
      return [{ from: s.from, to: s.from + len }];
    });
  }
  const frames = segments.reduce((n, s) => n + Math.max(1, Math.round((s.to - s.from) / rate)), 0);
  return { segments, rate: Math.round(rate * 1000) / 1000, frames, keptSeconds: kept / FPS };
}

export function totalSeconds(sceneFrames: number[]) {
  const intros = Object.values(INTRO_SECONDS).reduce((a, b) => a + b, 0) * FPS;
  return (TITLE_SECONDS * FPS + CLOSING_SECONDS * FPS + intros + sceneFrames.reduce((a, b) => a + b, 0)) / FPS;
}

/** Where in the recording (ms) a frame of the played scene comes from. */
export function sourceMs(segments: { from: number; to: number }[], rate: number, frame: number) {
  let at = 0;
  for (const s of segments) {
    const len = Math.max(1, Math.round((s.to - s.from) / rate));
    if (frame < at + len) return ((s.from + (frame - at) * rate) / FPS) * 1000;
    at += len;
  }
  const last = segments[segments.length - 1];
  return last ? (last.to / FPS) * 1000 : 0;
}

export const SCREEN = { w: 1920, h: 1080 };
export const MAX_ZOOM = 1.9;
const MOVE_MS = 700;
const PAD = 56;

export interface View {
  scale: number;
  cx: number;
  cy: number;
}

const WIDE: View = { scale: 1, cx: SCREEN.w / 2, cy: SCREEN.h / 2 };

/** The view that frames a rect: as close as fits (never past MAX_ZOOM), kept inside the screen. */
export function frameRect(rect: Rect | null): View {
  if (!rect) return WIDE;
  const scale = Math.max(1, Math.min(MAX_ZOOM, SCREEN.w / (rect.w + 2 * PAD), SCREEN.h / (rect.h + 2 * PAD)));
  const hw = SCREEN.w / 2 / scale;
  const hh = SCREEN.h / 2 / scale;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return { scale, cx: clamp(rect.x + rect.w / 2, hw, SCREEN.w - hw), cy: clamp(rect.y + rect.h / 2, hh, SCREEN.h - hh) };
}

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

/** The camera at a moment of the recording: glides from the previous framing to the latest one. */
export function cameraAt(keys: CameraKey[] | undefined, ms: number): View {
  if (!keys?.length) return WIDE;
  let i = -1;
  for (let k = 0; k < keys.length; k++) if (keys[k].t <= ms) i = k;
  if (i < 0) return WIDE;
  const to = frameRect(keys[i].rect);
  const from = i > 0 ? frameRect(keys[i - 1].rect) : WIDE;
  const p = ease(Math.min(1, Math.max(0, (ms - keys[i].t) / MOVE_MS)));
  return { scale: from.scale + (to.scale - from.scale) * p, cx: from.cx + (to.cx - from.cx) * p, cy: from.cy + (to.cy - from.cy) * p };
}

/** Words in a caption line (numbers count as words). */
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
