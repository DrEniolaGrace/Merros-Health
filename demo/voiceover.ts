/**
 * Adds the voiceover to the finished demo video, without touching the picture.
 *
 *   npx tsx demo/voiceover.ts check    generate each line (edge-tts) and report whether it fits its slot
 *   npx tsx demo/voiceover.ts mix      place every line at its time and export docs/merros_demo_voiceover.mp4
 *
 * A line longer than its slot (the time until the next line starts) is never sped up: "check"
 * names it so it can be shortened in demo/voiceover.json.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "demo", "out", "voice");
const PY = process.env.PYTHON ?? "C:/Users/USER/AppData/Local/Programs/Python/Python312/python.exe";

interface Script {
  voice: string;
  rate: string;
  video: string;
  lines: { at: string; text: string }[];
}

function ffmpeg(name: "ffmpeg" | "ffprobe" = "ffmpeg"): string {
  const r = createRequire(require.resolve("@remotion/renderer/package.json"));
  const exe = path.join(path.dirname(r.resolve("@remotion/compositor-win32-x64-msvc/package.json")), `${name}.exe`);
  return fs.existsSync(exe) ? exe : name;
}

const seconds = (at: string) => {
  const [m, s] = at.split(":").map(Number);
  return m * 60 + s;
};

function duration(file: string): number {
  const r = spawnSync(ffmpeg("ffprobe"), ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { encoding: "utf8" });
  return Number(r.stdout.trim());
}

function generate(script: Script) {
  fs.mkdirSync(OUT, { recursive: true });
  return script.lines.map((line, i) => {
    const file = path.join(OUT, `line-${String(i + 1).padStart(2, "0")}.mp3`);
    const r = spawnSync(PY, ["-m", "edge_tts", "--voice", script.voice, `--rate=${script.rate}`, "--text", line.text, "--write-media", file], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`edge-tts failed on line ${i + 1}: ${r.stderr}`);
    return { ...line, file, start: seconds(line.at), length: duration(file) };
  });
}

async function main() {
  const mode = process.argv[2] ?? "check";
  const script = JSON.parse(fs.readFileSync(path.join(ROOT, "demo", "voiceover.json"), "utf8")) as Script;
  const videoLength = duration(script.video);
  const clips = generate(script);
  let ok = true;
  clips.forEach((c, i) => {
    const end = i + 1 < clips.length ? clips[i + 1].start : videoLength;
    const slot = end - c.start;
    const fits = c.length <= slot;
    if (!fits) ok = false;
    console.log(`${c.at}  ${c.length.toFixed(1)} s of speech, slot ${slot.toFixed(1)} s  ${fits ? "fits" : `TOO LONG by ${(c.length - slot).toFixed(1)} s`}  "${c.text.slice(0, 50)}..."`);
  });
  console.log(`Video length: ${videoLength.toFixed(1)} s`);
  if (mode !== "mix") return;
  if (!ok) throw new Error("Some lines are longer than their slots. Shorten them in demo/voiceover.json first.");

  // Each line delayed to its start time, all mixed into one voice track, laid over the untouched picture.
  const out = path.join(ROOT, "docs", "merros_demo_voiceover.mp4");
  const inputs = clips.flatMap((c) => ["-i", c.file]);
  const delays = clips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.start * 1000)}|${Math.round(c.start * 1000)}[a${i}]`).join(";");
  const mix = `${clips.map((_, i) => `[a${i}]`).join("")}amix=inputs=${clips.length}:normalize=0,volume=1.6[voice]`;
  const r = spawnSync(ffmpeg(), ["-v", "error", "-y", "-i", script.video, ...inputs, "-filter_complex", `${delays};${mix}`, "-map", "0:v", "-map", "[voice]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", videoLength.toFixed(3), out], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg could not mix the voiceover");
  console.log(`Saved ${path.relative(ROOT, out)} (${duration(out).toFixed(1)} s)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
