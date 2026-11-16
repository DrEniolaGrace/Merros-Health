/**
 * The demo story, one clip per scene, recorded in order on fresh seed data (pnpm demo).
 * Each scene keeps only the footage worth watching; set up and AI thinking time are cut.
 */
import { expect, test } from "@playwright/test";
import { Scene } from "./director";

test.describe.configure({ mode: "serial" });

test("s1 Mariam receives and understands her result", async ({ browser }) => {
  const s = await Scene.start(browser, "s1");
  const p = s.page;
  await s.as("Mariam", "", /\/en\/onboarding/);
  s.keep();
  await s.hold(2200);
  for (let i = 0; i < 4; i++) await s.click(p.getByRole("button", { name: "Continue" }), 650);
  await s.hold(1200);
  await s.click(p.getByRole("switch", { name: "Show me my result" }), 600);
  await s.click(p.getByRole("switch", { name: "Compare with my partner, privately" }), 900);
  await s.click(p.getByRole("button", { name: "Save my choices" }), 0);
  await s.settle(() => expect(p).toHaveURL(/\/en\/import/, { timeout: 60_000 }));
  await s.hold(1500);
  await s.click(p.getByRole("button", { name: "Verify and open" }), 0);
  await s.settle(() => expect(p.getByText("Signature verified")).toBeVisible());
  await s.hold(2400);
  await s.click(p.getByRole("link", { name: "Open my result" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "You carry 2 gene changes" })).toBeVisible());
  await s.hold(2800);
  await s.show(p.locator("[data-your-plan]"), "start");
  await s.hold(2800);
  s.cut();
  await s.go("/en/teach-back");
  s.keep();
  await s.hold(1500);
  await s.click(p.getByText("I have one changed copy of a gene and I am usually healthy"), 500);
  await s.click(p.getByRole("button", { name: "Check my answer" }), 0);
  await s.settle(() => expect(p.getByText("That's right")).toBeVisible());
  await s.hold(2500);
  await s.finish();
});

test("s2 Genetic Copilot in Arabic and English", async ({ browser }) => {
  const s = await Scene.start(browser, "s2");
  const p = s.page;
  await s.as("Mariam", "/ar/copilot");
  s.keep();
  await s.hold(1800);
  await s.type(p.locator("#copilot-q"), "ما معنى أن أكون حاملة لتغيّر جيني؟", 60);
  await p.keyboard.press("Enter");
  await s.hold(1500);
  s.cut();
  await expect(p.locator("[data-copilot-answer]").first()).toBeVisible({ timeout: 120_000 });
  await s.hold(400);
  s.keep();
  await s.show(p.locator("[data-copilot-answer]").first(), "start");
  await s.hold(4500);
  s.cut();
  await s.go("/en/copilot");
  s.keep();
  await s.hold(1200);
  await s.type(p.locator("#copilot-q"), "We are both HBB carriers. What is the chance for each pregnancy?", 40);
  await p.keyboard.press("Enter");
  await s.hold(1500);
  s.cut();
  await expect(p.locator("[data-copilot-answer]").first()).toBeVisible({ timeout: 120_000 });
  await s.hold(400);
  s.keep();
  await s.show(p.locator("[data-copilot-answer]").first(), "start");
  await s.hold(4500);
  await s.finish();
});

test("s3 Blind Couple Match with both partners consenting", async ({ browser }) => {
  const s = await Scene.start(browser, "s3");
  const p = s.page;
  await s.as("Mariam", "/en/couple");
  s.keep();
  await s.hold(2200);
  await s.click(p.getByRole("button", { name: "Turn my key" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your key is turned" })).toBeVisible());
  await s.hold(1800);
  await s.click(p.getByRole("button", { name: "Demo: switch to Khalid's phone" }), 0);
  await s.settle(() => expect(p.getByRole("button", { name: "Turn my key" })).toBeVisible());
  await s.hold(1500);
  await s.click(p.getByRole("button", { name: "Turn my key" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your key is turned" })).toBeVisible());
  await s.hold(1500);
  await s.click(p.getByRole("button", { name: "Demo: switch to Mariam's phone" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your private match is ready" })).toBeVisible());
  await s.hold(1800);
  await s.click(p.getByRole("button", { name: "Reveal our result" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your shared carrier result" })).toBeVisible());
  await s.hold(1000);
  await s.show(p.getByRole("heading", { name: "Your shared carrier result" }), "start");
  await s.hold(3000);
  await s.show(p.locator("[data-your-plan=shared]"), "start");
  await s.hold(3000);
  await s.finish();
});

test("s4 Counsellor Copilot", async ({ browser }) => {
  const s = await Scene.start(browser, "s4");
  const p = s.page;
  // Off camera: Hamad books a session and sends a question.
  await s.as("Hamad", "/en/support");
  await p.locator("label").filter({ hasText: /at \d/ }).first().click();
  await p.getByLabel("Questions for your session").fill("Will my children need testing?");
  await p.getByRole("button", { name: "Book this session" }).click();
  await expect(p.getByRole("heading", { name: "Your session is booked" })).toBeVisible();

  await s.as("Dr. Layla Haddad", "/en/counsellor/open/hamad", /\/en\/counsellor/);
  await expect(p).toHaveURL(/\/en\/counsellor\/case\//);
  s.keep();
  await s.hold(2800);
  await s.show(p.getByText("Will my children need testing?"));
  await s.hold(2400);
  await s.type(p.getByLabel("Your private notes"), "Hamad carries a VUS in HBB. Explained it is not counted as a risk. Children can be offered testing as adults.", 28);
  await s.click(p.getByRole("button", { name: "Draft patient summary" }), 300);
  s.cut();
  await expect(p.getByLabel(/Summary for the patient/)).not.toHaveValue("", { timeout: 120_000 });
  await s.hold(400);
  s.keep();
  await s.show(p.getByLabel(/Summary for the patient/));
  await s.hold(3800);
  await s.click(p.getByRole("button", { name: "Sign and release to patient" }), 0);
  await s.settle(() => expect(p.getByText("Signed and released.", { exact: false })).toBeVisible());
  await s.hold(2200);
  await s.finish();
});

test("s5 Living Results after a simulated ClinVar update", async ({ browser }) => {
  const s = await Scene.start(browser, "s5");
  const p = s.page;
  await s.as("Dr. Layla Haddad", "/en/counsellor", /\/en\/counsellor/);
  s.keep();
  await s.hold(2200);
  await s.click(p.getByRole("button", { name: "Simulate ClinVar update" }), 0);
  await s.settle(() => expect(p.locator("[data-task]").first()).toContainText("Likely pathogenic", { timeout: 60_000 }));
  await s.hold(500);
  await s.show(p.locator("[data-task]").first());
  await s.hold(3200);
  await s.click(p.getByRole("button", { name: "I have told the patient: release the update" }).first(), 0);
  await s.settle(() => expect(p.locator("[data-task]")).toHaveCount(0, { timeout: 60_000 }));
  await s.hold(1200);
  await s.as("Hamad", "/en/result");
  await expect(p.locator("[data-updated-result]")).toBeVisible();
  await s.hold(3800);
  await s.finish();
});

test("s6 Family Risk Engine", async ({ browser }) => {
  const s = await Scene.start(browser, "s6");
  const p = s.page;
  await s.as("Khalid", "/en/family?gene=HBB");
  s.keep();
  await s.hold(2400);
  const relation = p.getByLabel("Relationship");
  await s.glide(relation);
  await relation.selectOption({ label: "First cousin" });
  await s.hold(900);
  await s.click(p.getByRole("button", { name: "Add relative" }), 0);
  await s.settle(() => expect(p.locator("[data-relative=first_cousin]")).toContainText("19.9%", { timeout: 60_000 }));
  await s.hold(600);
  await s.show(p.locator("[data-relative=first_cousin]"));
  await s.hold(3000);
  await s.click(p.getByRole("button", { name: "Create a private link" }), 0);
  await s.settle(() => expect(p.locator("[data-invite-url]")).toBeVisible());
  await s.hold(3000);
  await s.finish();
});

test("s7 Risk Beyond the Panel", async ({ browser }) => {
  const s = await Scene.start(browser, "s7");
  const p = s.page;
  await s.as("Dr. Layla Haddad", "/en/counsellor/open/khalid", /\/en\/counsellor/);
  await expect(p.locator("[data-counsellor-beyond=pending_counsellor]")).toBeVisible();
  await p.locator("[data-counsellor-beyond]").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await s.hold(800);
  s.keep();
  await s.hold(3200);
  await s.scrollBy(380);
  await s.hold(2800);
  await s.click(p.getByRole("button", { name: "I have discussed this with the couple: release the summary" }), 0);
  await s.settle(() => expect(p.locator("[data-counsellor-beyond=released]")).toBeVisible({ timeout: 60_000 }));
  await s.hold(1200);
  await s.as("Khalid", "/en/couple");
  await p.locator("[data-beyond-released]").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await s.hold(3800);
  await s.finish();
});

test("s8 Population Signals dashboard", async ({ browser }) => {
  const s = await Scene.start(browser, "s8");
  const p = s.page;
  await s.as("Programme Admin", "/en/admin", /\/en\/admin/);
  s.keep();
  await s.hold(2800);
  await s.show(p.locator("[data-signal=map]"), "start");
  await s.hold(2800);
  await s.show(p.locator("[data-signal=forecast]"), "start");
  await s.hold(3000);
  await s.show(p.locator("[data-signal=budget]"));
  await s.hold(1200);
  await s.click(p.getByRole("button", { name: /Publish a new release/ }), 0);
  await s.settle(() => expect(p.locator("[data-budget-spent]")).toHaveAttribute("data-budget-spent", "4", { timeout: 60_000 }));
  await s.show(p.locator("[data-signal=budget]"));
  await s.hold(2800);
  await s.finish();
});
