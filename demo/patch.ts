/**
 * Replaces single moments of a finished video with newly recorded shots, at the same timestamps and
 * the same length, drawn in the same style (app window, caption bar). Everything else is untouched.
 *
 *   npx tsx demo/patch.ts <input.mp4> <output.mp4>
 *
 * The pieces (PIECES below) name the scene part they replace and the new clip (demo/fix-clips.spec.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { FPS, type ClipInfo } from "./timeline";
import { spans } from "./spans";
import type { PatchProps, TimelineScene } from "./video/composition";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "demo", "out", "public");
const WORK = path.join(ROOT, "demo", "out", "patch");

/** What to replace: scene key, which part (or the whole scene), and the new clip. */
const PIECES = [
  { name: "couple result", scene: "s2", part: 5, clip: "pb", fadeIn: 0, fadeOut: 0, settled: true },
  { name: "Mariam's updated result", scene: "s4", part: 3, clip: "pa", fadeIn: 0, fadeOut: 12, settled: true },
  { name: "Arabic Copilot", scene: "m1", part: null, clip: "pc", fadeIn: 6, fadeOut: 6, settled: false },
  { name: "Family Risk Engine", scene: "m2", part: null, clip: "pd", fadeIn: 6, fadeOut: 6, settled: false },
] as const;

function ffmpeg(): string {
  const r = createRequire(require.resolve("@remotion/renderer/package.json"));
  const exe = path.join(path.dirname(r.resolve("@remotion/compositor-win32-x64-msvc/package.json")), "ffmpeg.exe");
  return fs.existsSync(exe) ? exe : "ffmpeg";
}

function run(args: string[]) {
  const r = spawnSync(ffmpeg(), ["-v", "error", "-y", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
}

/** Same encoder settings for every piece, so they join without re-encoding. */
const ENCODE = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", String(FPS), "-g", "60", "-an"];

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error("Usage: npx tsx demo/patch.ts <input.mp4> <output.mp4>");
  fs.mkdirSync(WORK, { recursive: true });
  const captions = JSON.parse(fs.readFileSync(path.join(ROOT, "demo", "captions.json"), "utf8"));
  const all = spans();

  // 1. Each new clip, fitted exactly to the length of the piece it replaces.
  const jobs = PIECES.map((piece, i) => {
    const sc = all.find((s) => s.key === piece.scene)!;
    const startFrame = piece.part === null ? sc.startFrame : sc.parts[piece.part].startFrame;
    const endFrame = piece.part === null ? sc.endFrame : sc.parts[piece.part].endFrame;
    const target = endFrame - startFrame;
    const info = JSON.parse(fs.readFileSync(path.join(PUBLIC, "clips", `${piece.clip}.json`), "utf8")) as ClipInfo;
    info.segments = info.segments.filter((s) => s.to - s.from >= 100); // drop empty parts
    const kept = info.segments.reduce((n, s) => n + ((s.to - s.from) / 1000) * FPS, 0);
    const rate = Math.round((kept / target) * 1000) / 1000;
    // The clip, already at this speed, steady 30 fps, every frame a keyframe.
    const name = `${piece.clip}@${rate}.mp4`;
    run(["-itsscale", String(1 / rate), "-i", path.join(PUBLIC, "clips", `${piece.clip}.webm`), "-r", String(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-g", "1", "-bf", "0", "-pix_fmt", "yuv420p", "-an", path.join(PUBLIC, "clips", name)]);
    let at = 0;
    const segments = info.segments.map((s, k) => {
      const from = Math.round(((s.from / 1000) * FPS) / rate);
      const len = k === info.segments.length - 1 ? target - at : Math.max(1, Math.round((((s.to - s.from) / 1000) * FPS) / rate));
      at += len;
      return { from, to: from + len };
    });
    const c = captions.scenes[piece.scene];
    const scene: TimelineScene = {
      key: piece.scene,
      clip: `clips/${name}`,
      index: piece.scene.startsWith("m") ? 0 : Number(piece.scene.slice(1)),
      caption: c.caption,
      evidence: c.evidence,
      introFrames: 0,
      segments,
      rate: 1,
      frames: target,
    };
    console.log(`${piece.name}: ${(startFrame / FPS).toFixed(2)}-${(endFrame / FPS).toFixed(2)} s, ${(kept / FPS).toFixed(1)} s of new footage at ${rate}x`);
    return { i, piece, startFrame, endFrame, scene };
  });

  // 2. Render each piece in the video's own style.
  fs.mkdirSync(path.join(PUBLIC, "brand"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "public", "brand", "merros-mark.png"), path.join(PUBLIC, "brand", "merros-mark.png"));
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "demo", "video", "index.tsx"), publicDir: PUBLIC });
  for (const j of jobs) {
    const props: PatchProps = { scene: j.scene, montage: captions.montage, fadeIn: j.piece.fadeIn, fadeOut: j.piece.fadeOut, settled: j.piece.settled };
    const composition = await selectComposition({ serveUrl, id: "Patch", inputProps: props });
    await renderMedia({ composition, serveUrl, codec: "h264", crf: 16, outputLocation: path.join(WORK, `new-${j.i}.mp4`), inputProps: props });
  }

  // 3. Cut the original around the pieces and join everything, frame accurate.
  const sorted = [...jobs].sort((a, b) => a.startFrame - b.startFrame);
  const total = Number(/Duration: (\d+):(\d+):([\d.]+)/.exec(spawnSync(ffmpeg(), ["-i", input], { encoding: "utf8" }).stderr)!.slice(1).reduce((t, v, k) => t + Number(v) * [3600, 60, 1][k], 0));
  const totalFrames = Math.round(total * FPS);
  const list: string[] = [];
  let cursor = 0;
  let n = 0;
  const keepOriginal = (from: number, to: number) => {
    if (to <= from) return;
    const out = path.join(WORK, `piece-${n++}.mp4`);
    run(["-i", input, "-ss", (from / FPS).toFixed(4), "-frames:v", String(to - from), ...ENCODE, out]);
    list.push(out);
  };
  for (const j of sorted) {
    keepOriginal(cursor, j.startFrame);
    const out = path.join(WORK, `piece-${n++}.mp4`);
    run(["-i", path.join(WORK, `new-${j.i}.mp4`), "-frames:v", String(j.endFrame - j.startFrame), ...ENCODE, out]);
    list.push(out);
    cursor = j.endFrame;
  }
  keepOriginal(cursor, totalFrames);
  const listFile = path.join(WORK, "list.txt");
  fs.writeFileSync(listFile, list.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
  run(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", output]);
  console.log(`Saved ${output}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
