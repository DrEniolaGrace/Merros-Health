/**
 * Quick screenshots of single screens, at the video's settings (1920 x 1080, page at 150%), to check
 * a fix without recording video. Run: npx playwright test -c demo/playwright.demo.config.ts check.spec.ts
 * Pick screens with --grep. Screenshots go to demo/out/check.
 */
import { expect, test, type Page } from "@playwright/test";

const ZOOM_CSS = "html { zoom: 1.5; } [data-judge-tour-button] { display: none !important; }";

async function open(page: Page, persona: string, path: string, home = /\/(home|counsellor|admin)/) {
  await page.addStyleTag({ content: "" }).catch(() => undefined);
  await page.goto("/en/login");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await expect(async () => {
    await page.getByRole("button", { name: `Continue as ${persona}` }).click();
    await expect(page).toHaveURL(home, { timeout: 8000 });
  }).toPass({ timeout: 90_000 });
  await page.goto(path);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.addStyleTag({ content: ZOOM_CSS });
}

test.use({ viewport: { width: 1920, height: 1080 } });

test("family graph", async ({ page }) => {
  await open(page, "Khalid", "/en/family?gene=HBB");
  const graph = page.locator("figure").first();
  await graph.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "demo/out/check/family.png" });
});

test("mariam result", async ({ page }) => {
  await open(page, "Mariam", "/en/result");
  await page.waitForTimeout(4000); // the counters finish counting
  await page.screenshot({ path: "demo/out/check/result.png" });
});
