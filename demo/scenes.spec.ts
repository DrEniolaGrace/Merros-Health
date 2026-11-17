/**
 * The demo story: one couple, Mariam and Khalid, recorded in order on fresh seed data (pnpm demo).
 * Four scenes (s1 to s4) and four short montage shots (m1 to m4). Each clip keeps only the footage
 * worth watching; set up and AI thinking time are cut. The whole screen is always shown; `show`
 * scrolls the important part fully into the frame, from the elements' own positions.
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
  await s.show([p.getByText("Show me my result", { exact: true }), recontact]);
  s.keep();
  await s.hold(1600);
  await s.click(showResult, 450);
  await s.click(p.getByRole("switch", { name: "Compare with my partner, privately" }), 450);
  await s.click(p.getByRole("switch", { name: "Let my genetic counsellor see my result" }), 450);
  await s.click(recontact, 800);
  await s.click(p.getByRole("button", { name: "Save my choices" }), 0);
  await s.settle(() => expect(p).toHaveURL(/\/en\/import/, { timeout: 60_000 }));
  await s.hold(700);
  await s.click(p.getByRole("button", { name: "Verify and open" }), 0);
  await s.settle(() => expect(p.getByText("Signature verified")).toBeVisible());
  await s.show([p.getByText("Signature verified"), p.getByRole("link", { name: "Open my result" })]);
  await s.hold(1500);
  await s.click(p.getByRole("link", { name: "Open my result" }), 0);
  await s.settle(() => expect(p.getByRole("heading", { name: "You carry 2 gene changes" })).toBeVisible());
  await s.hold(2600);
  await s.show(p.locator("[data-your-plan]"));
  await s.hold(2600);
  s.cut();

  // Teach Back: right first time, then a wrong answer, a new explanation, and the right answer.
  await s.go("/en/teach-back");
  const check = p.getByRole("button", { name: "Check my answer" });
  const next = p.getByRole("button", { name: "Next question" });
  await s.show([p.getByText("In your own words, what does being a carrier mean?"), check]);
  s.keep();
  await s.hold(1200);
  await s.click(p.getByText("I have one changed copy of a gene and I am usually healthy"), 350);
  await s.click(check, 0);
  await s.settle(() => expect(p.getByText("That's right")).toBeVisible());
  await s.hold(900);
  await s.click(next, 0);
  const wrong = p.getByText("If the first child is affected, the next three will not be");
  await s.settle(() => expect(wrong).toBeVisible());
  await s.show([p.getByText("If both partners carry a change in the same gene", { exact: false }), check]);
  await s.click(wrong, 350);
  await s.click(check, 0);
  const retry = p.getByText("Not quite. Here is another way to think about it.");
  await s.settle(() => expect(retry).toBeVisible());
  await s.show([retry, check]);
  await s.hold(2600);
  await s.click(p.getByText("1 in 4 for every pregnancy, each time"), 350);
  await s.click(check, 0);
  await s.settle(() => expect(p.getByText("That's right")).toBeVisible());
  await s.hold(900);
  s.cut();
  // Off camera: the third question, answered correctly.
  await next.click();
  await p.getByText("No, it shows a chance. Other tests can give more certainty").click();
  await check.click();
  await expect(p.getByText("That's right")).toBeVisible();
  await p.getByRole("button", { name: "See my results" }).click();
  const summary = p.getByText("You answered 2 of 3 on the first try and 3 of 3 in the end.");
  await expect(summary).toBeVisible();
  await s.show(summary);
  s.keep();
  await s.hold(2600);
  await s.finish();
});

test("s2 Blind Couple Match: a plan, not a verdict", async ({ browser }) => {
  const s = await Scene.start(browser, "s2");
  const p = s.page;
  await s.as("Mariam", "/en/couple");
  const key = () => p.getByRole("button", { name: "Turn my key" });
  await s.show([p.locator("main h1").first(), key()]);
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
  await s.show([p.getByRole("heading", { name: "Your shared carrier result" }), p.getByText("You both carry a change in GJB2")]);
  await s.hold(3200);
  await s.show(p.locator("[data-your-plan=shared]"));
  await s.hold(3600);
  await s.click(p.getByRole("button", { name: "Tell our counsellor and book" }), 0);
  await s.settle(() => expect(p).toHaveURL(/\/en\/support/, { timeout: 60_000 }));
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
  // The brief opens on Mariam's summary: her understanding rose from 67% to 100% with Teach Back.
  const understanding = p.getByText("67% → 100%");
  await expect(understanding).toBeVisible();
  await s.show(understanding);
  s.keep();
  await s.hold(2600);
  await s.show(p.getByText("What are our options for having healthy children?"));
  await s.hold(2400);
  const notes = p.getByLabel("Your private notes");
  const draft = p.getByRole("button", { name: "Draft patient summary" });
  await s.show([notes, draft]);
  await s.type(notes, "Both carry HBB and GJB2 changes. Discussed prenatal testing and IVF with PGT-M. CFTR VUS not counted as a risk.", 22);
  await s.click(draft, 300);
  s.cut();
  const summary = p.getByLabel(/Summary for the patient/);
  await expect(summary).not.toHaveValue("", { timeout: 120_000 });
  await s.hold(400);
  const sign = p.getByRole("button", { name: "Sign and release to patient" });
  await s.show([summary, sign]);
  s.keep();
  await s.hold(4200);
  await s.click(sign, 0);
  const signed = p.getByText("Signed and released.", { exact: false });
  await s.settle(() => expect(signed).toBeVisible());
  await s.show(signed);
  await s.hold(2000);
  await s.finish();
});

test("s4 One year later: Living Results", async ({ browser }) => {
  const s = await Scene.start(browser, "s4");
  const p = s.page;
  await s.as("Dr. Layla Haddad", "/en/counsellor", /\/en\/counsellor/);
  const simulate = p.getByRole("button", { name: "Simulate ClinVar update" });
  await s.show([p.getByRole("heading", { name: "Living Results" }), simulate]);
  s.keep();
  await s.hold(1600);
  await s.click(simulate, 0);
  const task = p.locator("[data-task]").filter({ hasText: "Mariam" });
  await s.settle(() => expect(task).toContainText("Likely benign", { timeout: 60_000 }));
  await s.show(task);
  await s.hold(4200);
  await s.click(task.getByRole("button", { name: "I have told the patient: release the update" }), 0);
  await s.settle(() => expect(task).toHaveCount(0, { timeout: 60_000 }));
  await s.hold(1000);
  await s.as("Mariam", "/en/result");
  const updated = p.locator("[data-updated-result]");
  await expect(updated).toBeVisible();
  await s.show([p.getByRole("heading", { name: "You carry 2 gene changes" }), updated]);
  await s.hold(4200);
  await s.finish();
});

test("m1 Copilot in Arabic", async ({ browser }) => {
  const s = await Scene.start(browser, "m1");
  const p = s.page;
  const q = "ما معنى أن أكون حاملة لتغيّر جيني؟";
  await s.as("Mariam", "/ar/copilot");
  await s.show(p.locator("#copilot-q"));
  s.keep();
  await s.hold(800);
  await s.type(p.locator("#copilot-q"), q, 30);
  await p.keyboard.press("Enter");
  await s.hold(400);
  s.cut();
  // The answer arrives whole (checked by the Safety Verifier first); wait for it and its sources.
  const answer = p.locator("[data-copilot-answer]").first();
  await expect(answer).toBeVisible({ timeout: 120_000 });
  await expect(answer).not.toContainText("[");
  await s.hold(2000);
  // The question and the answer together.
  await s.show([p.getByText(q, { exact: true }).first(), answer]);
  s.keep();
  await s.hold(5200);
  await s.finish();
});

test("m2 Family Risk Engine", async ({ browser }) => {
  const s = await Scene.start(browser, "m2");
  const p = s.page;
  await s.as("Khalid", "/en/family?gene=HBB");
  const relation = p.getByLabel("Relationship");
  const add = p.getByRole("button", { name: "Add relative" });
  await s.show([relation, add]);
  await relation.selectOption({ label: "First cousin" });
  s.keep();
  await s.hold(900);
  await s.click(add, 0);
  const cousin = p.locator("[data-relative=first_cousin]");
  await s.settle(() => expect(cousin).toContainText("19.9%", { timeout: 60_000 }));
  await s.show(cousin);
  await s.hold(3600);
  await s.finish();
});

test("m3 Risk Beyond the Panel", async ({ browser }) => {
  const s = await Scene.start(browser, "m3");
  const p = s.page;
  await s.as("Dr. Layla Haddad", "/en/counsellor/open/khalid", /\/en\/counsellor/);
  const section = p.locator("[data-counsellor-beyond]");
  await expect(section).toBeVisible();
  await s.show(section, { strict: false }); // taller than the screen: framed from its top
  s.keep();
  await s.hold(3300);
  await s.show(section.getByRole("button", { name: "I have discussed this with the couple: release the summary" }));
  await s.hold(2600);
  await s.finish();
});

test("m4 Population Signals", async ({ browser }) => {
  const s = await Scene.start(browser, "m4");
  const p = s.page;
  await s.as("Programme Admin", "/en/admin", /\/en\/admin/);
  await s.show(p.locator("[data-signal=map]"), { strict: false });
  s.keep();
  await s.hold(3300);
  await s.show(p.locator("[data-signal=forecast]"), { strict: false });
  await s.hold(2600);
  await s.finish();
});
