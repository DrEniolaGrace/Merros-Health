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
import { CLOSING_SECONDS, FPS, TARGET_SECONDS, TITLE_SECONDS, sceneTiming, totalSeconds, type ClipInfo } from "./timeline";
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
  const scenes: TimelineScene[] = Object.keys(TARGET_SECONDS).map((key, i) => {
    const file = path.join(PUBLIC, "clips", `${key}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing clip ${key}. Record the scenes first: pnpm demo`);
    const clip = JSON.parse(fs.readFileSync(file, "utf8")) as ClipInfo;
    const t = sceneTiming(clip, TARGET_SECONDS[key]);
    const c = captions.scenes[key];
    console.log(`${key}: ${t.keptSeconds.toFixed(1)} s kept, played at ${t.rate}x, ${(t.frames / FPS).toFixed(1)} s on screen`);
    return { key, clip: steadyClip(key), index: i + 1, title: c.title, text: c.text, evidence: c.evidence, segments: t.segments, rate: t.rate, frames: t.frames };
  });
  const props: DemoProps = { fps: FPS, titleFrames: TITLE_SECONDS * FPS, closingFrames: CLOSING_SECONDS * FPS, scenes, captions };
  console.log(`Total: ${totalSeconds(scenes.map((s) => s.frames)).toFixed(0)} seconds`);
  const empty = Object.entries(captions.placeholders as Record<string, string>).filter(([, v]) => !String(v).trim()).map(([k]) => k);
  if (empty.length) console.log(`Placeholders still empty (shown highlighted): ${empty.join(", ")}`);

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
