import { expect, test } from "@playwright/test";

test("Population Signals: private statistics, a visible budget, and a refusal when it runs out", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Programme Admin" }).click();
  await expect(page).toHaveURL(/\/en\/admin/);
  await expect(page.getByRole("heading", { name: /Population Signals/ })).toBeVisible();
  await expect(page.getByText("Merros does not track marriage outcomes")).toBeVisible();

  // Every signal is on the page.
  for (const s of ["map", "budget", "forecast", "funnel", "wait", "comprehension", "wellbeing", "safety", "outreach"]) {
    await expect(page.locator(`[data-signal=${s}]`)).toBeVisible();
  }
  await expect(page.getByRole("img", { name: /Line chart of booked counselling sessions/ })).toBeVisible();
  await expect(page.locator("[data-region-forecast=abu_dhabi]")).toContainText("counsellor");
  await expect(page.locator("[data-funnel=abu_dhabi]")).toContainText("Result received");

  // The seeded release used 2 of 6. Two more fit; the next one is refused.
  const spent = page.locator("[data-budget-spent]");
  await expect(spent).toHaveAttribute("data-budget-spent", "2");
  const publish = page.getByRole("button", { name: /Publish a new release/ });
  await publish.click();
  await expect(spent).toHaveAttribute("data-budget-spent", "4");
  await publish.click();
  await expect(spent).toHaveAttribute("data-budget-spent", "6");
  await expect(publish).toBeDisabled();
  await expect(page.locator("[data-budget-exhausted]")).toContainText("Refused");
});

test("Population Signals is for the programme only", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Khalid" }).click();
  await expect(page).toHaveURL(/\/en\/home/);
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: /Population Signals/ })).toHaveCount(0);
});

test("Copilot voice: an answer can be listened to, and a question can be asked by voice", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Khalid" }).click();
  await expect(page).toHaveURL(/\/en\/home/);
  await page.goto("/en/copilot");
  // No Azure key in the test stack, so the browser's own speech is used and labelled as such.
  await expect(page.getByText("Voice: this browser")).toBeVisible();
  await expect(page.locator("[data-mic]")).toBeVisible();
  await page.getByRole("button", { name: "What does being a carrier mean?" }).click();
  const answer = page.locator("[data-copilot-answer]").first();
  await expect(answer).toBeVisible();
  const listen = answer.locator("[data-listen]");
  await expect(listen).toHaveText("Listen");
  // Headless browsers have no audio device, so only check that pressing it does not break the page.
  await listen.click();
  await expect(answer).toBeVisible();
});
