import { expect, test } from "@playwright/test";

/**
 * Regression: after verifying a result, opening "My result" from the navigation must show the
 * result straight away, even if the page was visited before the import (stale client cache).
 */
test("My result shows the imported result without needing another page first", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Aisha" }).click();
  await expect(page).toHaveURL(/\/en\/onboarding/);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("switch", { name: "Show me my result" }).click();
  await page.getByRole("button", { name: "Save my choices" }).click();
  await expect(page).toHaveURL(/\/en\/import/);

  // Visit My result before importing: it offers to open the waiting result.
  await page.getByRole("navigation").getByRole("link", { name: "My result" }).click();
  await expect(page.getByText("Your result is ready to open")).toBeVisible();

  // Import, then use the navigation again (client side).
  await page.getByRole("link", { name: "Verify and open" }).click();
  await page.getByRole("button", { name: "Verify and open" }).click();
  await expect(page.getByText("Signature verified")).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "My result" }).click();
  await expect(page.getByText("You are a carrier for Sickle cell disease")).toBeVisible({ timeout: 8000 });
});

test("A condition card has a way back to all conditions", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Khalid" }).click();
  await expect(page).toHaveURL(/\/en\/home/);
  await page.goto("/en/learn/sickle-cell");
  await page.getByRole("link", { name: "All conditions" }).click();
  await expect(page).toHaveURL(/\/en\/learn$/);
  await expect(page.getByRole("heading", { name: "Learn" })).toBeVisible();
});
