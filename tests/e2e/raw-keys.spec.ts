import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/** Same pattern as RAW_KEY in lib/ai/citations.ts: a translation key or source marker left on screen. */
const RAW_KEY = /\[[a-z][a-z0-9_-]*(?:[.#][a-z0-9_-]+)+\]/i;
/** next-intl prints "namespace.key" when a translation is missing. */
const NAMESPACES = Object.keys(JSON.parse(fs.readFileSync("messages/en.json", "utf8")));
const MISSING_MESSAGE = new RegExp(String.raw`\b(?:${NAMESPACES.join("|")})\.[a-z][a-zA-Z]+\b`);

const PATIENT = ["/home", "/result", "/video", "/learn", "/wellbeing", "/couple", "/options", "/values", "/family", "/copilot", "/support", "/find-care", "/pathway", "/screening", "/privacy"];

async function loginAs(page: Page, name: string, home: RegExp) {
  await page.goto("/en/login");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await expect(async () => {
    await page.getByRole("button", { name: `Continue as ${name}` }).click();
    await expect(page).toHaveURL(home, { timeout: 8000 });
  }).toPass({ timeout: 60_000 });
}

async function expectClean(page: Page, where: string) {
  const text = await page.locator("body").innerText();
  expect(text, where).not.toMatch(RAW_KEY);
  expect(text, where).not.toMatch(MISSING_MESSAGE);
}

test("No raw key or missing translation on any patient page, in English or Arabic", async ({ page }) => {
  test.setTimeout(240_000);
  await loginAs(page, "Khalid", /\/en\/home/);
  for (const locale of ["en", "ar"]) {
    for (const path of PATIENT) {
      await page.goto(`/${locale}${path}`);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await expectClean(page, `/${locale}${path}`);
    }
  }
});

test("No raw key in Copilot answers about classifications, in Arabic or English", async ({ page }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  for (const [locale, question] of [
    ["ar", "ماذا يعني محتمل أنه حميد؟"],
    ["en", "What does likely benign mean?"],
  ] as const) {
    await page.goto(`/${locale}/copilot`);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.locator("#copilot-q").fill(question);
    await page.locator("#copilot-q").press("Enter");
    const answer = page.locator("[data-copilot-answer]").first();
    await expect(answer).toBeVisible({ timeout: 90_000 });
    await expect(answer.locator("p").first()).not.toBeEmpty();
    await expectClean(page, `${locale} copilot`);
  }
});

test("No raw key on the counsellor and programme pages", async ({ page }) => {
  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  await expectClean(page, "counsellor queue");
  await page.goto("/en/counsellor/open/hamad");
  await expect(page).toHaveURL(/\/en\/counsellor\/case\//);
  await expectClean(page, "counsellor brief");
  await page.goto("/ar/counsellor");
  await expectClean(page, "ar counsellor queue");
  await loginAs(page, "Programme Admin", /\/en\/admin/);
  await expectClean(page, "admin");
  await page.goto("/ar/admin");
  await expectClean(page, "ar admin");
});
