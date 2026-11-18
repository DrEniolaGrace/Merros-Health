/**
 * Quick screenshots of single screens, at the video's settings (1920 x 1080, page at 150%), to check
 * a fix without recording video. Run: npx playwright test -c demo/playwright.demo.config.ts check.spec.ts
 * Pick screens with --grep. Screenshots go to demo/out/check.
 */
import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1920, height: 1080 } });

async function open(page: Page, persona: string, path: string, home = /\/(home|counsellor|admin)/) {
  await page.addInitScript(() => {
    const add = () => {
      const s = document.createElement("style");
      s.textContent = "html { zoom: 1.5; } [data-judge-tour-button] { display: none !important; }";
      document.head.appendChild(s);
    };
    if (document.readyState === "loading") addEventListener("DOMContentLoaded", add);
    else add();
  });
  await page.goto("/en/login");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(800);
  // One click, then wait patiently: sign in against the hosted dev database can take a while.
  await page.getByRole("button", { name: `Continue as ${persona}` }).click();
  await expect(page).toHaveURL(home, { timeout: 90_000 });
  await page.goto(path);
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

/** Centres an element below the sticky header. */
async function centre(page: Page, el: ReturnType<Page["locator"]>) {
  await el.first().evaluate((n) => n.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(600);
}

/** Off camera, on fresh demo data: Mariam onboards and opens her result; a year later the counsellor releases her update. */
test("setup", async ({ page }) => {
  await open(page, "Mariam", "/en/onboarding", /\/en\/onboarding/);
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(300);
  }
  for (const name of ["Show me my result", "Compare with my partner, privately", "Let my genetic counsellor see my result", "Tell me if science changes my result"]) {
    await page.getByRole("switch", { name }).click();
  }
  await page.getByRole("button", { name: "Save my choices" }).click();
  await expect(page).toHaveURL(/\/en\/import/, { timeout: 60_000 });
  await page.getByRole("button", { name: "Verify and open" }).click();
  await page.getByRole("link", { name: "Open my result" }).click();
  await expect(page.getByRole("heading", { name: "You carry 2 gene changes" })).toBeVisible({ timeout: 60_000 });
  await open(page, "Dr. Layla Haddad", "/en/counsellor", /\/en\/counsellor/);
  await page.getByRole("button", { name: "Simulate ClinVar update" }).click();
  const task = page.locator("[data-task]").filter({ hasText: "Mariam" });
  await expect(task).toContainText("Likely benign", { timeout: 60_000 });
  await task.getByRole("button", { name: "I have told the patient: release the update" }).click();
  await expect(task).toHaveCount(0, { timeout: 60_000 });
});

test("mariam result", async ({ page }) => {
  await open(page, "Mariam", "/en/result");
  await expect(page.locator("[data-updated-result]")).toBeVisible();
  await page.waitForTimeout(4000); // the counters finish counting
  await page.screenshot({ path: "demo/out/check/1-result.png" });
});

test("couple result", async ({ page }) => {
  await open(page, "Mariam", "/en/couple");
  const key = page.getByRole("button", { name: "Turn my key" });
  if (await key.isVisible()) {
    await key.click();
    await expect(page.getByRole("heading", { name: "Your key is turned" })).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: "Demo: switch to Khalid's phone" }).click();
    await page.getByRole("button", { name: "Turn my key" }).click();
    await expect(page.getByRole("heading", { name: "Your key is turned" })).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: "Demo: switch to Mariam's phone" }).click();
  }
  const reveal = page.getByRole("button", { name: "Reveal our result" });
  const shared = page.getByRole("heading", { name: "Your shared carrier result" });
  await expect(reveal.or(shared)).toBeVisible({ timeout: 60_000 });
  if (await reveal.isVisible()) await reveal.click();
  await expect(shared).toBeVisible({ timeout: 60_000 });
  await centre(page, page.getByText("43.75%"));
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "demo/out/check/2-couple.png" });
});

test("copilot arabic", async ({ page }) => {
  const q = "ما معنى أن أكون حاملة لتغيّر جيني؟";
  await open(page, "Mariam", "/ar/copilot");
  await page.locator("#copilot-q").fill(q);
  await page.locator("#copilot-q").press("Enter");
  const answer = page.locator("[data-copilot-answer]").first();
  await expect(answer).toBeVisible({ timeout: 120_000 });
  await page.waitForTimeout(1500);
  await page.locator("p").filter({ hasText: q }).first().evaluate((n) => n.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -160));
  await page.waitForTimeout(800);
  await page.screenshot({ path: "demo/out/check/3-copilot.png" });
});

test("family graph", async ({ page }) => {
  await open(page, "Khalid", "/en/family?gene=HBB");
  for (const relation of ["Brother or sister", "Parent", "Aunt or uncle", "First cousin"]) {
    const existing = await page.locator("[data-relative]").count();
    const kind = { "Brother or sister": "sibling", Parent: "parent", "Aunt or uncle": "aunt_uncle", "First cousin": "first_cousin" }[relation];
    if (await page.locator(`[data-relative=${kind}]`).count()) continue;
    await page.getByLabel("Relationship").selectOption({ label: relation });
    await page.getByRole("button", { name: "Add relative" }).click();
    await expect(page.locator("[data-relative]")).toHaveCount(existing + 1, { timeout: 60_000 });
  }
  await centre(page, page.locator("figure"));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "demo/out/check/4-family.png" });
});
