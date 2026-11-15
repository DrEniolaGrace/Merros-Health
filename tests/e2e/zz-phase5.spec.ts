import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

/** Moves the distress slider. Retries, because input in the first instant after load can be missed. */
async function setDistress(page: Page, score: string) {
  const save = page.getByRole("button", { name: "Save my answer" });
  await expect(async () => {
    await page.getByRole("slider").fill(score === "0" ? "1" : "0");
    await page.getByRole("slider").fill(score);
    await expect(save).toBeEnabled({ timeout: 2000 });
  }).toPass({ timeout: 30000 });
  await save.click();
}

async function loginAs(page: Page, name: string, home: RegExp) {
  await page.goto("/en/login");
  // A click in the first instant after load can be dropped by the router, so retry like a person would.
  await expect(async () => {
    await page.getByRole("button", { name: `Continue as ${name}` }).click();
    await expect(page).toHaveURL(home, { timeout: 8000 });
  }).toPass({ timeout: 40000 });
}

test("Distress Check: a high score brings calm support, a callback choice, and reaches the counsellor", async ({ page }) => {
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/wellbeing");
  await expect(page.getByRole("heading", { name: "How are you feeling?" })).toBeVisible();
  await setDistress(page, "8");
  await expect(page.locator("[data-distress-band=high]")).toBeVisible();
  await expect(page.locator("[data-crisis]")).toContainText("to be verified before release");
  await page.getByRole("button", { name: "A psychologist" }).click();
  await expect(page.locator("[data-callback-done]")).toContainText("A psychologist will call you this week");

  // The counsellor sees the reason and the callback request, and the score in the brief.
  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  await expect(page.locator("[data-case=hamad] [data-callback-requested]")).toContainText("asked for a psychologist callback");
  await expect(async () => {
    await page.locator("[data-case=hamad]").getByRole("link", { name: "Open brief" }).click();
    await expect(page).toHaveURL(/\/en\/counsellor\/case\//, { timeout: 5000 });
  }).toPass({ timeout: 30000 });
  await expect(page.locator("[data-brief-wellbeing]")).toContainText("Latest distress score: 8 out of 10");
  await expect(page.locator("[data-brief-wellbeing]")).toContainText("Values Summary not shared");
});

test("Distress Check: a low score needs no callback", async ({ page }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  await page.goto("/en/wellbeing");
  await setDistress(page, "1");
  await expect(page.locator("[data-distress-band=low]")).toBeVisible();
  await expect(page.locator("[data-callback]")).toHaveCount(0);
  await expect(page.locator("[data-crisis]")).toHaveCount(0);
});

test("Values Compass: options relate to the person's own values without ranking, and sharing is a choice", async ({ page }) => {
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/values");
  await expect(page.getByRole("heading", { name: "Values Compass" })).toBeVisible();
  await expect(page.locator("[data-relate]")).toContainText("Rate all seven above");

  const rate = async (value: string, label: string) => page.locator(`[data-value=${value}]`).getByText(label, { exact: true }).click();
  await rate("faith", "Essential");
  await rate("family", "Somewhat");
  await rate("biological", "Essential");
  await rate("procedures", "Very");
  await rate("certainty", "A little");
  await rate("cost", "Not important");
  await rate("time", "Somewhat");

  // All seven options are shown, each with what it fits and what it may pull against. Nothing is marked best.
  await expect(page.locator("[data-option-fit]")).toHaveCount(7);
  const ivf = page.locator("[data-option-fit=ivf-pgtm]");
  await expect(ivf).toContainText("Tends to fit with");
  await expect(ivf).toContainText("Having biological children");
  await expect(ivf).toContainText("May pull against");
  await expect(ivf).toContainText("Avoiding medical procedures");
  await expect(ivf).toContainText("Depends on your own situation");
  await expect(ivf).toContainText("My faith");
  await expect(page.locator("[data-relate]")).not.toContainText(/recommended|best option|best fit|score/i);

  for (const [key, answer] of [["sure", "No"], ["understand", "Yes"], ["riskBenefit", "Yes"], ["encouragement", "Yes"]] as const) {
    await page.locator(`[data-sure=${key}]`).getByText(answer, { exact: true }).click();
  }
  await page.getByRole("switch", { name: "Share my Values Summary with my genetic counsellor" }).click();
  await page.getByRole("button", { name: "Save my values" }).click();
  await expect(page.locator("[data-values-saved='3']")).toContainText("more information or support would help");

  // Shared by choice: the counsellor now sees the summary.
  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  await expect(async () => {
    await page.locator("[data-case=hamad]").getByRole("link", { name: "Open brief" }).click();
    await expect(page).toHaveURL(/\/en\/counsellor\/case\//, { timeout: 5000 });
  }).toPass({ timeout: 30000 });
  const summary = page.locator("[data-values-summary]");
  await expect(summary).toContainText("SURE test: 3 of 4 answered yes");
  await expect(summary).toContainText("My faith");
  await expect(summary).toContainText("Having biological children");
  await expect(summary).not.toContainText("Keeping costs manageable");

  // The consent is visible and revocable in Privacy.
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/privacy");
  await expect(page.getByRole("switch", { name: "Share my Values Summary with my counsellor" })).toHaveAttribute("aria-checked", "true");
});
