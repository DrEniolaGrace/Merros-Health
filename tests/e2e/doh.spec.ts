import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, name: string, home: RegExp) {
  await page.goto("/en/login");
  await expect(async () => {
    await page.getByRole("button", { name: `Continue as ${name}` }).click();
    await expect(page).toHaveURL(home, { timeout: 8000 });
  }).toPass({ timeout: 40000 });
}

test("The tested panel is the Abu Dhabi premarital panel, searchable by old and new gene names", async ({ page }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  await page.goto("/en/result");
  await page.getByRole("button", { name: "Genes tested (563)" }).click();
  await expect(page.getByText("It covers autosomal recessive genes only.", { exact: false })).toBeVisible();
  await expect(page.locator("[data-panel-list='563']")).toBeVisible();
  await page.getByPlaceholder("Search a gene, for example GBA").fill("GBA");
  await expect(page.locator("[data-panel-gene=GBA1]")).toContainText("GBA1 (GBA)");
  await page.getByPlaceholder("Search a gene, for example GBA").fill("BRCA1");
  await expect(page.getByText("That gene is not on this panel.")).toBeVisible();
});

test("The journey follows the official steps, and optional steps are never 'you are here'", async ({ page }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  await page.goto("/en/pathway");
  const main = page.locator("main");
  await expect(main).toContainText("Screening visit: consent given, samples taken");
  await expect(main).toContainText("Premarital Screening and Counselling Report issued");
  await expect(main.locator("li", { hasText: "Confirmatory haemoglobin test" })).toContainText("Only if needed");
  await expect(main.locator("li", { hasText: "Results understood" })).toContainText("You are here");
});

test("About and sources: the DoH standard is cited, and Merros is not affiliated with the Department", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.locator("[data-site-footer]")).toContainText("not affiliated with or endorsed by the Department of Health Abu Dhabi");
  await page.locator("[data-site-footer]").getByRole("link", { name: "About and sources" }).click();
  await expect(page).toHaveURL(/\/en\/sources/);
  await expect(page.locator("[data-not-affiliated]")).toContainText("It is not affiliated with or endorsed by the Department of Health Abu Dhabi.");
  await expect(page.locator("[data-source=doh]")).toContainText("DoH/STD/PSS/V3, version 3, September 2024");
  await expect(page.locator("[data-source=doh]")).toContainText("563 genes");
  await page.goto("/ar/sources");
  await expect(page.locator("[data-not-affiliated]")).toContainText("لا يتبع دائرة الصحة أبوظبي");
});

test("The admin passcode can be typed in one go", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_PASSCODE, "needs a server started with DEMO_ADMIN_PASSCODE");
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Judge Tour" }).click();
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  const box = page.getByLabel("Admin passcode");
  await box.click();
  // Typed key by key, as a person does. Before the fix, focus left the box after the first key.
  await box.pressSequentially("typed-in-one-go-123", { delay: 30 });
  await expect(box).toHaveValue("typed-in-one-go-123");
  await expect(box).toBeFocused();
});
