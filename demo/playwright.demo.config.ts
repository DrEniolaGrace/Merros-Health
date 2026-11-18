import { defineConfig } from "@playwright/test";

/** Demo recording (pnpm demo). Not part of the test suite: it records clips and screenshots. */
export default defineConfig({
  testDir: ".",
  testMatch: ["scenes.spec.ts", "screens.spec.ts", "check.spec.ts", "fix-clips.spec.ts"],
  outputDir: "out/playwright",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 10 * 60_000,
  // The app runs against the hosted dev database, so saves can take several seconds.
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: { baseURL: process.env.DEMO_BASE_URL ?? "http://localhost:3100", headless: true },
});
