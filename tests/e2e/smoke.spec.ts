import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("Mariam: onboarding, consent, signed import, result, couple risk, teach back, audit", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.getByText("Synthetic demo data").filter({ visible: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Continue as Mariam" }).click();

  // Onboarding: language, reading level, media, pregnancy, consent.
  await expect(page).toHaveURL(/\/en\/onboarding/);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Continue" }).click();
  // Nothing is pre ticked.
  await expect(page.getByRole("switch", { name: "Show me my result" })).toHaveAttribute("aria-checked", "false");
  await page.getByRole("switch", { name: "Show me my result" }).click();
  await page.getByRole("switch", { name: "Compare with my partner, privately" }).click();
  await page.getByRole("button", { name: "Save my choices" }).click();

  // Signed import: a tampered delivery is refused, the real one verifies.
  await expect(page).toHaveURL(/\/en\/import/);
  await page.getByRole("button", { name: "Demo: simulate a tampered delivery" }).click();
  await expect(page.getByText("Merros refused this result")).toBeVisible();
  await page.getByRole("button", { name: "Verify and open" }).click();
  await expect(page.getByText("Signature verified")).toBeVisible();
  await page.getByRole("link", { name: "Open my result" }).click();

  // Risk Explainer.
  await expect(page.getByRole("heading", { name: "You carry 2 gene changes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Beta thalassaemia" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "GJB2 related hearing loss" })).toBeVisible();
  await expect(page.getByText("Risk is not a diagnosis").first()).toBeVisible();
  await expect(page.locator("[data-safety-label=education]").first()).toBeVisible();

  // Couple: both consented (Khalid in seed) -> per gene 25%, combined 43.75%.
  await page.goto("/en/couple");
  await expect(page.getByText("You both carry a change in HBB")).toBeVisible();
  await expect(page.getByText("You both carry a change in GJB2")).toBeVisible();
  await expect(page.getByLabel("43.75%").first()).toBeVisible();

  // Teach Back: one wrong answer shows a different explanation.
  await page.goto("/en/teach-back");
  await page.getByText("I have the condition").click();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByText("Not quite. Here is another way to think about it.")).toBeVisible();
  await page.getByText("I have one changed copy of a gene and I am usually healthy").click();
  await page.getByRole("button", { name: "Check my answer" }).click();
  // The confirmation appears inside the card, in view, with its own next step.
  await expect(page.getByText("That's right")).toBeInViewport();
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByText("1 in 4 for every pregnancy, each time").click();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByText("That's right")).toBeInViewport();
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByText("No, it shows a chance. Other tests can give more certainty").click();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByText("That's right")).toBeInViewport();
  await page.getByRole("button", { name: "See my results" }).click();
  await expect(page.getByText("You answered 2 of 3 on the first try and 3 of 3 in the end.")).toBeVisible();

  // Options: all seven, no ranking language.
  await page.goto("/en/options");
  await expect(page.locator("[data-option]")).toHaveCount(7);
  await expect(page.getByText(/recommended/i)).toHaveCount(0);

  // Escalation routes to a named counsellor.
  await page.goto("/en/support");
  await expect(page.getByText("You and your partner carry a change in the same gene.")).toBeVisible();
  await expect(page.getByText("Dr. Layla Haddad").first()).toBeVisible();

  // Privacy: access history and tamper evident audit chain.
  await page.goto("/en/privacy");
  await expect(page.getByText("Tampered result refused")).toBeVisible();
  await page.getByRole("button", { name: "Verify integrity" }).click();
  await expect(page.getByText(/Intact\. \d+ entries checked\./)).toBeVisible();

  // Export downloads JSON with the verified result.
  const res = await page.request.get("/api/export");
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.result.variants.map((v: { gene: string }) => v.gene).sort()).toEqual(["GJB2", "HBB"]);
  expect(JSON.stringify(json)).not.toContain("wrappedDataKey");
});

test("Arabic renders right to left with the synthetic data badge", async ({ page }) => {
  await page.goto("/ar/login");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByText("بيانات تجريبية").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "اختر شخصية تجريبية" })).toBeVisible();
});

test("Hamad's VUS routes him to a counsellor without any risk number", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue as Hamad" }).click();
  await expect(page).toHaveURL(/\/en\/home/);
  await page.goto("/en/result");
  await expect(page.getByRole("heading", { name: "A variant of uncertain significance" })).toBeVisible();
  await expect(page.getByText("In HBB. It is not counted in any risk number.")).toBeVisible();
  await expect(page.getByText(/% chance/)).toHaveCount(0);
  await page.goto("/en/support");
  await expect(page.getByText("Your result includes a variant of uncertain significance.", { exact: false })).toBeVisible();
});
