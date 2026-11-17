import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function loginAs(page: Page, name: string, home: RegExp) {
  await page.goto("/en/login");
  await page.getByRole("button", { name: `Continue as ${name}` }).click();
  await expect(page).toHaveURL(home);
}

test("Living Results: the counsellor is told first, the patient only after release", async ({ page }) => {
  // Before: Hamad has a VUS.
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/result");
  await expect(page.getByRole("heading", { name: "A variant of uncertain significance" })).toBeVisible();

  // The counsellor simulates the ClinVar update and gets a task.
  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  await page.getByRole("button", { name: "Simulate ClinVar update" }).click();
  // Only people who agreed to be told about changes get a task; Hamad did.
  const task = page.locator("[data-task]").filter({ hasText: "Hamad" });
  await expect(task).toContainText("Likely pathogenic");
  await expect(task).toContainText("Hamad");

  // Hamad is NOT told yet: his result and care page are unchanged.
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/result");
  await expect(page.getByRole("heading", { name: "A variant of uncertain significance" })).toBeVisible();
  await expect(page.locator("[data-updated-result]")).toHaveCount(0);
  await page.goto("/en/support");
  await expect(page.getByText("The scientific understanding of a variant")).toHaveCount(0);

  // The counsellor releases it after speaking to him.
  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  await page.locator("[data-task]").filter({ hasText: "Hamad" }).getByRole("button", { name: "I have told the patient: release the update" }).click();
  await expect(page.locator("[data-task]").filter({ hasText: "Hamad" })).toHaveCount(0);

  // Now Hamad sees the amended, lab signed result: he is an HBB carrier.
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/result");
  await expect(page.locator("[data-updated-result]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "You carry one gene change" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A variant of uncertain significance" })).toHaveCount(0);
  await page.goto("/en/support");
  await expect(page.getByText("The scientific understanding of a variant in your result has changed.", { exact: false })).toBeVisible();

  // The programme view counts one person affected, with no identity.
  await loginAs(page, "Programme Admin", /\/en\/admin/);
  const reclass = page.locator("[data-reclass-event]").filter({ hasText: "HBB" });
  await expect(reclass).toContainText("Fewer than 10 people (hidden)");
  await expect(page.locator("main")).not.toContainText("Hamad");
});

test("Counselling Hub: questions reach the counsellor, and only a signed summary reaches the patient", async ({ page }) => {
  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/support");
  await page.locator("label").filter({ hasText: /at \d/ }).first().click();
  await page.getByLabel("Questions for your session").fill("Will my children need testing?");
  await page.getByRole("button", { name: "Book this session" }).click();
  await expect(page.getByRole("heading", { name: "Your session is booked" })).toBeVisible();
  await expect(page.locator("[data-summary]")).toHaveCount(0);

  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  // Wait for the queue to settle after the login redirect before following the link.
  await expect(page.getByRole("heading", { name: "Case queue", exact: true })).toBeVisible();
  // A click in the instant after the login redirect can be dropped by the router, so retry like a person would.
  await expect(async () => {
    await page.locator("[data-case=hamad]").getByRole("link", { name: "Open brief" }).click();
    await expect(page).toHaveURL(/\/en\/counsellor\/case\//, { timeout: 5000 });
  }).toPass({ timeout: 30000 });
  await expect(page.getByText("Will my children need testing?")).toBeVisible();
  await page.getByLabel("Your private notes").fill("We discussed that you are a carrier of a change in the HBB gene. Carriers are healthy. Your children can be offered carrier testing when they are adults.");
  await page.getByRole("button", { name: "Draft patient summary" }).click();
  await expect(page.getByLabel(/Summary for the patient/)).toHaveValue(/carrier of a change in the HBB gene/);
  await page.getByRole("button", { name: "Sign and release to patient" }).click();
  await expect(page.getByText("Signed and released.", { exact: false })).toBeVisible();

  await loginAs(page, "Hamad", /\/en\/home/);
  await page.goto("/en/support");
  const summary = page.locator("[data-summary]").first();
  await expect(summary).toContainText("carrier of a change in the HBB gene");
  await expect(summary.locator("[data-safety-label=clinical_advice]")).toBeVisible();
  await expect(summary).toContainText("Signed by Dr. Layla Haddad");
});

test("Family Risk Engine: estimates by relationship and a private invitation that names no one", async ({ page, browser }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  await page.goto("/en/family?gene=HBB");
  await page.getByLabel("Relationship").selectOption({ label: "First cousin" });
  await page.getByRole("button", { name: "Add relative" }).click();
  // HBB: 1/8 + 7/8 x 8.5% = 19.9%
  await expect(page.locator("[data-relative=first_cousin]")).toContainText("19.9%");
  // GJB2: 1/8 + 7/8 x 2.5% = 14.7%
  await page.goto("/en/family?gene=GJB2");
  await expect(page.locator("[data-relative=first_cousin]")).toContainText("14.7%");

  await page.getByRole("button", { name: "Create a private link" }).click();
  const url = await page.locator("[data-invite-url]").innerText();
  expect(url).toMatch(/\/en\/invite\/[A-Za-z0-9_-]{20,}$/);

  // A relative opens the link on their own device, not signed in.
  const ctx = await browser.newContext();
  const relative = await ctx.newPage();
  await relative.goto(url);
  await expect(relative.getByRole("heading", { name: "Someone in your family thought this might help you" })).toBeVisible();
  const text = await relative.locator("main").innerText();
  expect(text).not.toMatch(/Khalid|Mariam|HBB|GJB2|cousin/i);
  await ctx.close();
});

test("Find Care: filters, and linking a family doctor with a consented referral", async ({ page }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  await page.goto("/en/find-care");
  await expect(page.locator("[data-result-count='14']")).toBeVisible();
  await page.getByLabel("Service").selectOption({ label: "Genetic counselling" });
  await expect(page.locator("[data-result-count='3']")).toBeVisible();
  await page.getByRole("combobox", { name: "Language" }).selectOption({ label: "Arabic" });
  await page.getByLabel("Clinician").selectOption({ label: "Female" });
  await expect(page.locator("[data-result-count='1']")).toBeVisible();
  await expect(page.getByText("Dr. Layla Haddad")).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).or(page.getByLabel("Service")).first().waitFor();
  await page.getByRole("combobox", { name: "Language" }).selectOption({ label: "Any" });
  await page.getByLabel("Clinician").selectOption({ label: "Any" });
  await page.getByLabel("Service").selectOption({ label: "Family doctor" });
  await page.getByRole("button", { name: "Set as my family doctor" }).first().click();
  await page.getByRole("switch", { name: "Share a carrier summary with my family doctor" }).click();
  await page.getByRole("button", { name: "Link family doctor" }).click();
  await expect(page.getByText("My family doctor", { exact: true })).toBeVisible();

  // The consent is visible, and revocable, in Privacy.
  await page.goto("/en/privacy");
  await expect(page.getByRole("switch", { name: "Share a carrier summary with my family doctor" })).toHaveAttribute("aria-checked", "true");
});
