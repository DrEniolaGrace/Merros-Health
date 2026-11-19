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

test("Judge Tour: six steps that follow Mariam and Khalid, and presenter controls only during the tour", async ({ page }) => {
  // Without the tour, presenter controls are hidden.
  await page.context().clearCookies({ name: "merros-tour" });
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Dr. Layla Haddad" }).click();
  await expect(page).toHaveURL(/\/en\/counsellor/, { timeout: 60000 });
  await expect(page.getByRole("heading", { name: "Living Results" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simulate ClinVar update" })).toHaveCount(0);

  // The tour opens on its welcome card.
  await page.getByRole("button", { name: "Judge Tour" }).click();
  const card = page.locator("[data-tour-card]");
  await expect(card).toContainText("Step 1 of 6");
  await expect(card).toContainText("following one couple, Mariam and Khalid");
  await expect(card.getByRole("button", { name: "Back" })).toBeDisabled();
  await expect(card.getByRole("button", { name: "Exit" })).toBeVisible();
  // During the tour, presenter controls appear, labelled.
  await expect(page.locator("[data-presenter-control]").filter({ hasText: "Simulate ClinVar update" })).toContainText("Presenter control");

  // Next signs in as Mariam and opens her first screen; the card follows.
  await card.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/\/en\/onboarding/, { timeout: 60000 });
  await expect(page.locator("[data-tour-card]")).toContainText("Step 2 of 6");
  await expect(page.locator("[data-tour-card]")).toContainText("Mariam's result day");

  // Exit ends the tour and hides presenter controls again.
  await page.locator("[data-tour-card]").getByRole("button", { name: "Exit" }).click();
  await expect(page.locator("[data-tour-card]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Judge Tour" })).toBeVisible();
});
