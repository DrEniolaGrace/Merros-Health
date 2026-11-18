/**
 * Where every scene, and every kept part of it, sits in the rendered video (seconds), worked out with
 * the same timing rules as demo/render.ts. Used to replace single shots in place.
 * Run: npx tsx demo/spans.ts
 */
import fs from "node:fs";
import path from "node:path";
import { FPS, HARD_MAX_RATE, INTRO_SECONDS, MAX_RATE, MAX_TOTAL_SECONDS, MONTAGE, STORY, TARGET_SECONDS, TITLE_SECONDS, sceneTiming, totalSeconds, type ClipInfo } from "./timeline";

const CLIPS = path.join(process.cwd(), "demo", "out", "public", "clips");

export function spans(clipDir = CLIPS) {
  const keys = [...STORY, ...MONTAGE] as string[];
  const clips = Object.fromEntries(keys.map((k) => [k, JSON.parse(fs.readFileSync(path.join(clipDir, `${k}.json`), "utf8")) as ClipInfo]));
  const isMontage = (k: string) => (MONTAGE as readonly string[]).includes(k);
  let maxRate = MAX_RATE;
  const at = (r: number) => keys.map((k) => sceneTiming(clips[k], TARGET_SECONDS[k], { trim: isMontage(k), maxRate: r }));
  while (totalSeconds(at(maxRate).map((t) => t.frames)) > MAX_TOTAL_SECONDS && maxRate < HARD_MAX_RATE) maxRate = Math.min(HARD_MAX_RATE, maxRate + 0.05);
  const timings = at(maxRate);
  let frame = TITLE_SECONDS * FPS;
  return keys.map((key, i) => {
    const t = timings[i];
    const intro = Math.round((INTRO_SECONDS[key] ?? 0) * FPS);
    const start = frame + intro;
    let f = start;
    const parts = t.segments.map((s) => {
      const len = Math.max(1, Math.round((s.to - s.from) / t.rate));
      const part = { startFrame: f, endFrame: f + len, sourceFromMs: (s.from / FPS) * 1000, sourceToMs: (s.to / FPS) * 1000 };
      f += len;
      return part;
    });
    frame = start + t.frames;
    return { key, rate: t.rate, introStartFrame: start - intro, startFrame: start, endFrame: start + t.frames, parts };
  });
}

if (process.argv[1]?.endsWith("spans.ts")) {
  const s = (f: number) => (f / FPS).toFixed(2);
  for (const sc of spans()) {
    console.log(`${sc.key}: ${s(sc.startFrame)}-${s(sc.endFrame)} s (rate ${sc.rate})`);
    sc.parts.forEach((p, i) => console.log(`   part ${i}: ${s(p.startFrame)}-${s(p.endFrame)} s  (recording ${(p.sourceFromMs / 1000).toFixed(1)}-${(p.sourceToMs / 1000).toFixed(1)} s)`));
  }
}
