/**
 * Before rendering: takes still frames from the kept footage of every clip (the middle of each
 * kept part) and puts them on one contact sheet per clip in demo/out/stills, to check that nothing
 * important touches the edges of the frame. Run: npx tsx demo/stills.ts
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { FPS, MAX_TOTAL_SECONDS, MONTAGE, STORY, TARGET_SECONDS, sceneTiming, totalSeconds, type ClipInfo } from "./timeline";

const ROOT = process.cwd();
const CLIPS = path.join(ROOT, "demo", "out", "public", "clips");
const OUT = path.join(ROOT, "demo", "out", "stills");

function ffmpeg(): string {
  const r = createRequire(require.resolve("@remotion/renderer/package.json"));
  const dir = path.dirname(r.resolve("@remotion/compositor-win32-x64-msvc/package.json"));
  const exe = path.join(dir, "ffmpeg.exe");
  return fs.existsSync(exe) ? exe : "ffmpeg";
}

async function main() {
  // sharp ships with Next.js; it is loaded from there, untyped.
  type Img = { resize(w: number, h: number): Img; toBuffer(): Promise<Buffer>; composite(c: { input: Buffer; left: number; top: number }[]): Img; png(): Img; toFile(f: string): Promise<unknown> };
  const sharp = createRequire(require.resolve("next/package.json"))("sharp") as (input: string | { create: { width: number; height: number; channels: 3; background: string } }) => Img;
  fs.mkdirSync(OUT, { recursive: true });
  const frames: number[] = [];
  for (const key of [...STORY, ...MONTAGE]) {
    const info = JSON.parse(fs.readFileSync(path.join(CLIPS, `${key}.json`), "utf8")) as ClipInfo;
    const t = sceneTiming(info, TARGET_SECONDS[key], { trim: (MONTAGE as readonly string[]).includes(key) });
    frames.push(t.frames);
    const files: string[] = [];
    info.segments.forEach((seg, i) => {
      const at = (seg.from + seg.to) / 2 / 1000;
      const file = path.join(OUT, `${key}-${i}.png`);
      spawnSync(ffmpeg(), ["-v", "error", "-y", "-ss", at.toFixed(2), "-i", path.join(CLIPS, `${key}.webm`), "-frames:v", "1", file]);
      if (fs.existsSync(file)) files.push(file);
    });
    const cols = 3;
    const w = 640;
    const h = 360;
    const tiles = await Promise.all(files.map((f) => sharp(f).resize(w, h).toBuffer()));
    await sharp({ create: { width: cols * w, height: Math.ceil(tiles.length / cols) * h, channels: 3, background: "#000" } })
      .composite(tiles.map((input, i) => ({ input, left: (i % cols) * w, top: Math.floor(i / cols) * h })))
      .png()
      .toFile(path.join(OUT, `${key}.png`));
    console.log(`${key}: ${files.length} stills, ${t.keptSeconds.toFixed(1)} s kept, ${(t.frames / FPS).toFixed(1)} s on screen`);
  }
  const total = totalSeconds(frames);
  console.log(`Video length: ${total.toFixed(0)} s (limit ${MAX_TOTAL_SECONDS} s)${total > MAX_TOTAL_SECONDS ? "  TOO LONG" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
