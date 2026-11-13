import { defineConfig, devices } from "@playwright/test";

/**
 * End to end smoke test. Runs against a server on localhost:3000 (start one with `pnpm build && pnpm start`,
 * or let Playwright start it). The demo data is reset before the run.
 */
/** The app under test. Defaults to the Docker stack; set E2E_BASE_URL to test a server on another port. */
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: BASE,
    ...devices["Pixel 5"],
    viewport: { width: 375, height: 812 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm start",
    url: BASE + "/en",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
