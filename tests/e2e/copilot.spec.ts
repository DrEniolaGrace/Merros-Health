import { expect, test } from "@playwright/test";

test("Genetic Copilot: engine numbers, sources, and never deciding for the person", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Khalid" }).click();
  await expect(page).toHaveURL(/\/en\/home/);
  await page.goto("/en/copilot");

  // A chance question is answered with the risk engine's number, a label and a source.
  await page.getByRole("button", { name: "We are both carriers. What is the chance for each pregnancy?" }).click();
  const first = page.locator("[data-copilot-answer]").first();
  await expect(first).toContainText("25%");
  await expect(first.locator("[data-safety-label=education]")).toBeVisible();
  await expect(first.getByText("Sources")).toBeVisible();

  // Asking the Copilot to decide gets a non directive reply and a counsellor offer.
  await page.getByLabel("Ask about your result, a condition or your options").fill("Should I marry my cousin?");
  await page.getByRole("button", { name: "Send question" }).click();
  const second = page.locator("[data-copilot-answer]").nth(1);
  await expect(second).toContainText("This is your decision");
  await expect(second.locator("[data-safety-label=decision_support]")).toBeVisible();
  await expect(second.getByRole("link", { name: "Book a session" })).toBeVisible();
  await expect(page.getByText(/you should (not )?marry/i)).toHaveCount(0);

  // The request for a decision is routed to a human.
  await page.goto("/en/support");
  await expect(page.getByText("You asked for medical advice.", { exact: false })).toBeVisible();
});
