import { defineConfig, devices } from "@playwright/test";

/**
 * End to end smoke test. Runs against a server on localhost:3000 (start one with `pnpm build && pnpm start`,
 * or let Playwright start it). The demo data is reset before the run.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    ...devices["Pixel 5"],
    viewport: { width: 375, height: 812 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/en",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
