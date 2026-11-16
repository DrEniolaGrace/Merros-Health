import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, name: string, home: RegExp) {
  await page.goto("/en/login");
  await expect(async () => {
    await page.getByRole("button", { name: `Continue as ${name}` }).click();
    await expect(page).toHaveURL(home, { timeout: 8000 });
  }).toPass({ timeout: 40000 });
}

test("A carrier's result ends with their plan: counselling, options, one next step", async ({ page }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  await page.goto("/en/result");
  const plan = page.locator("[data-your-plan=carrier]");
  await expect(plan.getByRole("heading", { name: "Your plan" })).toBeVisible();
  await expect(plan.locator("[data-plan-step]")).toHaveCount(3);
  await expect(plan.locator("[data-plan-step='1']").getByRole("link", { name: "Book a counsellor" })).toHaveAttribute("href", "/en/support");
  await expect(plan.locator("[data-plan-step='2']").getByRole("link", { name: "See all options" })).toHaveAttribute("href", "/en/options");
  await expect(plan.locator("[data-plan-step='2']").getByRole("link", { name: "Values Compass" })).toHaveAttribute("href", "/en/values");
  await expect(plan.locator("[data-plan-step='3']").getByRole("link", { name: "Check my understanding" })).toHaveAttribute("href", "/en/teach-back");
  await expect(plan).not.toContainText(/recommend|best option|you should/i);
});

test("An uncertain result gets a plan too, with a wellbeing check as the next step", async ({ page }) => {
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/result");
  const plan = page.locator("[data-your-plan=uncertain]");
  await expect(plan).toContainText("best explained by a specialist");
  await expect(plan.locator("[data-plan-step='3']").getByRole("link", { name: "Check in" })).toHaveAttribute("href", "/en/wellbeing");
});

test("The Judge Tour opens with what only Merros does, and its counsellor steps open the case", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Judge Tour" }).click();
  const unique = page.locator("[data-tour-group=unique]");
  await expect(unique.getByRole("heading", { name: "What only Merros does" })).toBeVisible();
  await expect(unique.locator("[data-tour-step]")).toHaveCount(4);
  const first = await unique.locator("[data-tour-step]").allInnerTexts();
  expect(first[0]).toContain("Living Results");
  expect(first[1]).toContain("Counsellor Copilot");
  expect(first[2]).toContain("Risk Beyond the Panel");
  expect(first[3]).toContain("Population Signals");
  await expect(page.locator("[data-tour-group=supporting]").getByRole("heading", { name: "Supporting features" })).toBeVisible();

  // Step 3 opens Khalid's case: the analysis Khalid and Mariam agreed to waits for the counsellor.
  await unique.locator("[data-tour-step=s16]").getByRole("button").click();
  await expect(page).toHaveURL(/\/en\/counsellor\/case\//, { timeout: 30000 });
  const beyond = page.locator("[data-counsellor-beyond=pending_counsellor]");
  await expect(beyond).toContainText("moderately above");
  await expect(beyond.locator("[data-beyond-consistency=consistent]")).toBeVisible();
});
