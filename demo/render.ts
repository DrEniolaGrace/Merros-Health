/**
 * Assembles the recorded clips, captions and title cards into docs/demo.mp4 with Remotion.
 * Run through pnpm demo (or pnpm demo --render-only to re-render after editing the captions).
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { CLOSING_SECONDS, FPS, INTRO_SECONDS, MAX_TOTAL_SECONDS, MONTAGE, STORY, TARGET_SECONDS, TITLE_SECONDS, sceneTiming, totalSeconds, type ClipInfo } from "./timeline";
import type { DemoProps, TimelineScene } from "./video/composition";

const ROOT = process.cwd();

/** The ffmpeg that ships with Remotion's renderer for this platform, or the one on PATH. */
function ffmpegPath(): string {
  const r = createRequire(require.resolve("@remotion/renderer/package.json"));
  const pkg = { win32: "@remotion/compositor-win32-x64-msvc", darwin: `@remotion/compositor-darwin-${process.arch}`, linux: `@remotion/compositor-linux-${process.arch}-gnu` }[process.platform as "win32" | "darwin" | "linux"];
  try {
    const dir = path.dirname(r.resolve(`${pkg}/package.json`));
    const exe = path.join(dir, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    if (fs.existsSync(exe)) return exe;
  } catch {
    // fall through
  }
  return "ffmpeg";
}

/**
 * Browser recordings have uneven frame timing, which the compositor cannot always seek in.
 * Each clip is converted once to a steady 30 frames per second before assembly.
 */
function steadyClip(key: string): string {
  const src = path.join(PUBLIC, "clips", `${key}.webm`);
  const dest = path.join(PUBLIC, "clips", `${key}.mp4`);
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs > fs.statSync(src).mtimeMs) return `clips/${key}.mp4`;
  const r = spawnSync(ffmpegPath(), ["-v", "error", "-y", "-i", src, "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-an", dest], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`Could not convert ${key}.webm`);
  return `clips/${key}.mp4`;
}
const PUBLIC = path.join(ROOT, "demo", "out", "public");
const OUT = path.join(ROOT, "docs", "demo.mp4");

async function main() {
  const captions = JSON.parse(fs.readFileSync(path.join(ROOT, "demo", "captions.json"), "utf8"));
  const keys = [...STORY, ...MONTAGE] as string[];
  const scenes: TimelineScene[] = keys.map((key) => {
    const file = path.join(PUBLIC, "clips", `${key}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing clip ${key}. Record the scenes first: pnpm demo`);
    const clip = JSON.parse(fs.readFileSync(file, "utf8")) as ClipInfo;
    const montage = (MONTAGE as readonly string[]).includes(key);
    const t = sceneTiming(clip, TARGET_SECONDS[key], { trim: montage });
    const c = captions.scenes[key];
    console.log(`${key}: ${t.keptSeconds.toFixed(1)} s kept, played at ${t.rate}x, ${(t.frames / FPS).toFixed(1)} s on screen`);
    return {
      key,
      clip: steadyClip(key),
      index: montage ? 0 : (STORY as readonly string[]).indexOf(key) + 1,
      caption: c.caption,
      evidence: c.evidence,
      intro: c.intro,
      introFrames: Math.round((INTRO_SECONDS[key] ?? 0) * FPS),
      segments: t.segments,
      rate: t.rate,
      frames: t.frames,
      camera: clip.camera ?? [],
    };
  });
  const props: DemoProps = { fps: FPS, titleFrames: TITLE_SECONDS * FPS, closingFrames: CLOSING_SECONDS * FPS, scenes, captions };
  const total = totalSeconds(scenes.map((s) => s.frames));
  console.log(`Total: ${total.toFixed(0)} seconds`);
  if (total > MAX_TOTAL_SECONDS) throw new Error(`The video would run ${total.toFixed(0)} s, over the ${MAX_TOTAL_SECONDS} s limit. Shorten a scene in demo/scenes.spec.ts.`);

  // The logo for the title and closing cards.
  fs.mkdirSync(path.join(PUBLIC, "brand"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "public", "brand", "merros-mark.png"), path.join(PUBLIC, "brand", "merros-mark.png"));

  console.log("Bundling the composition...");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "demo", "video", "index.tsx"), publicDir: PUBLIC });
  const composition = await selectComposition({ serveUrl, id: "Demo", inputProps: props });
  console.log("Rendering docs/demo.mp4...");
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 20,
    outputLocation: OUT,
    inputProps: props,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        console.log(`  ${pct}%`);
      }
    },
  });
  const mb = fs.statSync(OUT).size / 1024 / 1024;
  console.log(`Saved ${path.relative(ROOT, OUT)} (${mb.toFixed(1)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
