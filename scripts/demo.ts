/**
 * pnpm demo: records the demo video and the slide screenshots from scratch.
 *
 *   1. resets the demo data on the Neon dev branch (never production: guarded)
 *   2. builds the app and starts it on port 3100
 *   3. records each scene, then the screenshots (demo/scenes.spec.ts, demo/screens.spec.ts)
 *   4. assembles docs/demo.mp4 with Remotion (demo/render.ts)
 *
 * Options:
 *   --skip-build     reuse the last build
 *   --scenes-only    record the clips, no screenshots
 *   --screens-only   only the screenshots
 *   --render-only    only re-assemble the video from existing clips (after editing demo/captions.json)
 *
 * The video follows one couple, Mariam and Khalid: four scenes and a short montage, under three minutes.
 *   --offline-ai     use the offline demo model instead of Claude for the Copilot
 */
import "dotenv/config";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { assertSafeDatabase } from "@/lib/db/guard";

const args = new Set(process.argv.slice(2));
const PORT = "3100";
const BASE = `http://localhost:${PORT}`;

function run(cmd: string, a: string[], env: NodeJS.ProcessEnv = process.env) {
  console.log(`\n> ${cmd} ${a.join(" ")}`);
  const r = spawnSync(cmd, a, { stdio: "inherit", shell: true, env });
  if (r.status !== 0) throw new Error(`${cmd} ${a.join(" ")} failed`);
}

function stop(p: ChildProcess) {
  if (!p.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" });
  else p.kill("SIGTERM");
  // Belt and braces on Windows: whatever still listens on the demo port is stopped too.
  if (process.platform === "win32") {
    const out = spawnSync("netstat", ["-ano"], { encoding: "utf8" }).stdout ?? "";
    for (const line of out.split(/\r?\n/)) {
      const m = new RegExp(":" + PORT + "\\s.*LISTENING\\s+(\\d+)").exec(line);
      if (m) spawnSync("taskkill", ["/pid", m[1], "/T", "/F"], { stdio: "ignore" });
    }
  }
}

async function waitFor(url: string, seconds = 120) {
  for (let i = 0; i < seconds; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${url} did not start`);
}

async function main() {
  if (args.has("--render-only")) {
    run("npx", ["tsx", "demo/render.ts"]);
    return;
  }

  // The recording writes to the database it uses: only the Docker or Neon dev database is allowed.
  assertSafeDatabase("the demo recording");
  // On this Windows machine the database engine file can go missing after package installs.
  run("npx", ["prisma", "generate"]);
  run("pnpm", ["seed"]);
  if (!args.has("--skip-build")) run("pnpm", ["build"]);

  const offline = args.has("--offline-ai") || !process.env.AI_API_KEY;
  if (offline && !args.has("--offline-ai")) console.log("No AI_API_KEY in .env: the Copilot uses the offline demo model.");
  const env: NodeJS.ProcessEnv = { ...process.env, PORT, AI_PROVIDER: offline ? "mock" : "anthropic", DEMO_MODE: "true", PUBLIC_SITE_URL: "https://merros-health.vercel.app" };
  delete env.DEMO_ADMIN_PASSCODE;
  console.log(`\n> starting the app on ${BASE} (Copilot: ${offline ? "offline model" : "Claude"})`);
  const server = spawn("pnpm", ["start"], { shell: true, env, stdio: "ignore" });
  try {
    await waitFor(`${BASE}/en`);
    const files = args.has("--scenes-only") ? ["scenes.spec.ts"] : args.has("--screens-only") ? ["screens.spec.ts"] : ["scenes.spec.ts", "screens.spec.ts"];
    run("npx", ["playwright", "test", "-c", "demo/playwright.demo.config.ts", ...files], { ...process.env, DEMO_BASE_URL: BASE });
  } finally {
    stop(server);
  }
  if (!args.has("--screens-only")) run("npx", ["tsx", "demo/render.ts"]);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
