/**
 * The demo story: one couple, Mariam and Khalid, recorded in order on fresh seed data (pnpm demo).
 * Four scenes (s1 to s4) and four short montage shots (m1 to m4). Each clip keeps only the footage
 * worth watching; set up and AI thinking time are cut. `focus` tells the video where to zoom in.
 */
import { expect, test } from "@playwright/test";
import { Scene } from "./director";

test.describe.configure({ mode: "serial" });

test("s1 Mariam understands her result", async ({ browser }) => {
  const s = await Scene.start(browser, "s1");
  const p = s.page;
  await s.as("Mariam", "", /\/en\/onboarding/);
  // Off camera: language, reading level, media and pregnancy questions.
  for (let i = 0; i < 4; i++) {
    await p.getByRole("button", { name: "Continue" }).click();
    await s.hold(500);
  }
  const showResult = p.getByRole("switch", { name: "Show me my result" });
  const recontact = p.getByRole("switch", { name: "Tell me if science changes my result" });
  await expect(showResult).toBeVisible();
  await showResult.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await s.hold(900);
  await s.focus(p.getByText("Show me my result", { exact: true }), showResult, recontact);
  s.keep();
  await s.hold(1800);
  await s.click(showResult, 450);
  await s.click(p.getByRole("switch", { name: "Compare with my partner, privately" }), 450);
  await s.click(p.getByRole("switch", { name: "Let my genetic counsellor see my result" }), 450);
  await s.click(recontact, 900);
  s.wide();
  await s.click(p.getByRole("button", { name: "Save my choices" }), 0);
  await s.settle(() => expect(p).toHaveURL(/\/en\/import/, { timeout: 60_000 }));
  await s.hold(900);
  await s.click(p.getByRole("button", { name: "Verify and open" }), 0);
  await s.settle(() => expect(p.getByText("Signature verified")).toBeVisible());
  await s.focus(p.getByText("Signature verified"), p.getByRole("link", { name: "Open my result" }));
  await s.hold(1800);
  await s.click(p.getByRole("link", { name: "Open my result" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "You carry 2 gene changes" })).toBeVisible());
  s.wide();
  await s.hold(1200);
  await s.focus(p.getByRole("heading", { name: "You carry 2 gene changes" }));
  await s.hold(2400);
  await s.show(p.locator("[data-your-plan]"), "start");
  await s.focus(p.locator("[data-your-plan]"));
  await s.hold(2800);
  s.cut();
  await s.go("/en/teach-back");
  const answer = p.getByText("I have one changed copy of a gene and I am usually healthy");
  await s.focus(p.getByRole("heading").first(), p.getByRole("button", { name: "Check my answer" }));
  s.keep();
  await s.hold(1500);
  await s.click(answer, 400);
  await s.click(p.getByRole("button", { name: "Check my answer" }), 0);
  await s.settle(() => expect(p.getByText("That's right")).toBeVisible());
  await s.focus(p.getByText("That's right"));
  await s.hold(2400);
  await s.finish();
});

test("s2 Blind Couple Match: a plan, not a verdict", async ({ browser }) => {
  const s = await Scene.start(browser, "s2");
  const p = s.page;
  await s.as("Mariam", "/en/couple");
  const key = () => p.getByRole("button", { name: "Turn my key" });
  await s.focus(p.locator("main h1").first(), key());
  s.keep();
  await s.hold(1800);
  await s.click(key(), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your key is turned" })).toBeVisible());
  await s.hold(1200);
  await s.click(p.getByRole("button", { name: "Demo: switch to Khalid's phone" }), 0);
  await s.settle(() => expect(key()).toBeVisible());
  await s.hold(900);
  await s.click(key(), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your key is turned" })).toBeVisible());
  await s.hold(900);
  await s.click(p.getByRole("button", { name: "Demo: switch to Mariam's phone" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your private match is ready" })).toBeVisible());
  await s.hold(1200);
  await s.click(p.getByRole("button", { name: "Reveal our result" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "Your shared carrier result" })).toBeVisible());
  s.wide();
  await s.show(p.getByRole("heading", { name: "Your shared carrier result" }), "start");
  await s.focus(p.getByRole("heading", { name: "Your shared carrier result" }), p.getByText("You both carry a change in GJB2"));
  await s.hold(3200);
  const plan = p.locator("[data-your-plan=shared]");
  await s.show(plan, "start");
  await s.focus(plan);
  await s.hold(3600);
  await s.click(p.getByRole("button", { name: "Tell our counsellor and book" }), 0);
  await s.settle(() => expect(p).toHaveURL(/\/en\/support/, { timeout: 60_000 }));
  s.wide();
  await s.hold(1800);
  s.cut();

  // Off camera: Mariam books a session and sends a question for it.
  await p.locator("label").filter({ hasText: /at \d/ }).first().click();
  await p.getByLabel("Questions for your session").fill("What are our options for having healthy children?");
  await p.getByRole("button", { name: "Book this session" }).click();
  await expect(p.getByRole("heading", { name: "Your session is booked" })).toBeVisible();
  await s.finish();
});

test("s3 Dr. Layla prepares with the Counsellor Copilot", async ({ browser }) => {
  const s = await Scene.start(browser, "s3");
  const p = s.page;
  await s.as("Dr. Layla Haddad", "/en/counsellor/open/mariam", /\/en\/counsellor/);
  await expect(p).toHaveURL(/\/en\/counsellor\/case\//);
  s.keep();
  await s.hold(2000);
  const question = p.getByText("What are our options for having healthy children?");
  await s.show(question);
  await s.focus(question);
  await s.hold(2600);
  const notes = p.getByLabel("Your private notes");
  await s.show(notes);
  await s.focus(notes, p.getByRole("button", { name: "Draft patient summary" }));
  await s.type(notes, "Both carry HBB and GJB2 changes. Discussed prenatal testing and IVF with PGT-M. CFTR VUS not counted as a risk.", 22);
  await s.click(p.getByRole("button", { name: "Draft patient summary" }), 300);
  s.cut();
  await expect(p.getByLabel(/Summary for the patient/)).not.toHaveValue("", { timeout: 120_000 });
  await s.hold(400);
  const summary = p.getByLabel(/Summary for the patient/);
  await s.show(summary);
  await s.focus(summary, p.getByRole("button", { name: "Sign and release to patient" }));
  s.keep();
  await s.hold(4200);
  await s.click(p.getByRole("button", { name: "Sign and release to patient" }), 0);
  await s.settle(() => expect(p.getByText("Signed and released.", { exact: false })).toBeVisible());
  await s.focus(p.getByText("Signed and released.", { exact: false }));
  await s.hold(2200);
  await s.finish();
});

test("s4 One year later: Living Results", async ({ browser }) => {
  const s = await Scene.start(browser, "s4");
  const p = s.page;
  await s.as("Dr. Layla Haddad", "/en/counsellor", /\/en\/counsellor/);
  const simulate = p.getByRole("button", { name: "Simulate ClinVar update" });
  await s.show(simulate);
  await s.focus(simulate);
  s.keep();
  await s.hold(1600);
  await s.click(simulate, 0);
  const task = p.locator("[data-task]").filter({ hasText: "Mariam" });
  await s.settle(() => expect(task).toContainText("Likely benign", { timeout: 60_000 }));
  await s.show(task);
  await s.focus(task);
  await s.hold(4200);
  await s.click(task.getByRole("button", { name: "I have told the patient: release the update" }), 0);
  await s.settle(() => expect(task).toHaveCount(0, { timeout: 60_000 }));
  s.wide();
  await s.hold(1000);
  await s.as("Mariam", "/en/result");
  const updated = p.locator("[data-updated-result]");
  await expect(updated).toBeVisible();
  await s.show(updated);
  await s.focus(updated);
  await s.hold(4200);
  s.wide();
  await s.hold(2400);
  await s.finish();
});

test("m1 Copilot in Arabic", async ({ browser }) => {
  const s = await Scene.start(browser, "m1");
  const p = s.page;
  await s.as("Mariam", "/ar/copilot");
  await s.focus(p.locator("#copilot-q"));
  s.keep();
  await s.type(p.locator("#copilot-q"), "ما معنى أن أكون حاملة لتغيّر جيني؟", 35);
  await p.keyboard.press("Enter");
  await s.hold(500);
  s.cut();
  const answer = p.locator("[data-copilot-answer]").first();
  await expect(answer).toBeVisible({ timeout: 120_000 });
  await s.hold(600);
  await s.show(answer, "start");
  await s.focus(answer);
  s.keep();
  await s.hold(4000);
  await s.finish();
});

test("m2 Family Risk Engine", async ({ browser }) => {
  const s = await Scene.start(browser, "m2");
  const p = s.page;
  await s.as("Khalid", "/en/family?gene=HBB");
  await p.getByLabel("Relationship").selectOption({ label: "First cousin" });
  await s.hold(400);
  await s.click(p.getByRole("button", { name: "Add relative" }), 0);
  await expect(p.locator("[data-relative=first_cousin]")).toContainText("19.9%", { timeout: 60_000 });
  const cousin = p.locator("[data-relative=first_cousin]");
  await s.show(cousin);
  await s.focus(cousin);
  await s.hold(300);
  s.keep();
  await s.hold(4200);
  await s.finish();
});

test("m3 Risk Beyond the Panel", async ({ browser }) => {
  const s = await Scene.start(browser, "m3");
  const p = s.page;
  await s.as("Dr. Layla Haddad", "/en/counsellor/open/khalid", /\/en\/counsellor/);
  const section = p.locator("[data-counsellor-beyond]");
  await expect(section).toBeVisible();
  await section.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await s.hold(900);
  await s.focus(section);
  s.keep();
  await s.hold(4200);
  await s.finish();
});

test("m4 Population Signals", async ({ browser }) => {
  const s = await Scene.start(browser, "m4");
  const p = s.page;
  await s.as("Programme Admin", "/en/admin", /\/en\/admin/);
  const map = p.locator("[data-signal=map]");
  await map.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await s.hold(1200);
  await s.focus(map);
  s.keep();
  await s.hold(4200);
  await s.finish();
});
