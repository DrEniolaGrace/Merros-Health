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

test("Risk Beyond the Panel: both partners consent, the counsellor sees it first and releases it", async ({ page }) => {
  const consent = () => page.getByRole("switch", { name: "I agree to the Risk Beyond the Panel analysis" });

  // Noura agrees. Nothing is analysed until her partner agrees too.
  await loginAs(page, "Noura", /\/en\/home/);
  await page.goto("/en/couple");
  await expect(page.locator("[data-beyond=needs_consent]")).toContainText("Neither of you has agreed yet");
  await consent().click();
  await expect(page.locator("[data-beyond=needs_consent]")).toContainText("Waiting for Faisal to decide. Nothing has been analysed.");

  // Faisal agrees. The analysis exists now, but the couple cannot see it.
  await page.getByRole("button", { name: "Demo: continue as Faisal" }).click();
  await expect(page).toHaveURL(/\/en\/couple/);
  await expect(page.locator("[data-beyond=needs_consent]")).toContainText("Noura has agreed");
  await consent().click();
  await expect(page.locator("[data-beyond=with_counsellor]")).toContainText("is with your genetic counsellor");
  await expect(page.locator("[data-beyond-released]")).toHaveCount(0);

  // The counsellor sees the estimate, its limits and the release step.
  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  await expect(async () => {
    await page.locator("[data-case=noura]").getByRole("link", { name: "Open brief" }).click();
    await expect(page).toHaveURL(/\/en\/counsellor\/case\//, { timeout: 5000 });
  }).toPass({ timeout: 30000 });
  const section = page.locator("[data-counsellor-beyond=pending_counsellor]");
  await expect(section).toContainText("Counsellor only");
  await expect(section).toContainText("Your chance is about the same as for any couple.");
  await expect(section.locator("[data-beyond-consistency=consistent]")).toBeVisible();
  await expect(section).toContainText("not produced by a genomics pipeline");
  await section.getByRole("button", { name: "I have discussed this with the couple: release the summary" }).click();
  await expect(page.locator("[data-counsellor-beyond=released]")).toBeVisible();

  // Now the couple sees a plain language summary, marked as an estimate.
  await loginAs(page, "Noura", /\/en\/home/);
  await page.goto("/en/couple");
  const released = page.locator("[data-beyond-released]");
  await expect(released).toContainText("Your chance is about the same as for any couple.");
  await expect(released).toContainText("This is an estimate, not a diagnosis");
  await expect(released).not.toContainText("kinship");

  // Withdrawing deletes the analysis for both.
  await consent().click();
  await expect(page.locator("[data-beyond=needs_consent]")).toContainText("Faisal has agreed. Nothing is analysed unless you agree too.");
  await loginAs(page, "Dr. Layla Haddad", /\/en\/counsellor/);
  await expect(page.locator("[data-case=noura]")).toHaveCount(0);
});
