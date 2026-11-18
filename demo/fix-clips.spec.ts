/**
 * Replacement shots for single moments of the finished video (see demo/patch.ts), recorded with
 * the same settings as demo/scenes.spec.ts. Numbers are filmed only after they stop counting.
 * Run against a server whose data already has Mariam's update released (demo/check.spec.ts "setup").
 */
import { expect, test } from "@playwright/test";
import { Scene } from "./director";

test.describe.configure({ mode: "serial" });

/** Counters count up for about two seconds; wait well past that, off camera. */
const SETTLE = 3500;

test("pa Mariam's updated result", async ({ browser }) => {
  const s = await Scene.start(browser, "pa");
  const p = s.page;
  await s.as("Mariam", "/en/result");
  const tested = p.getByText("genes tested by the lab");
  await expect(p.locator("[data-updated-result]")).toBeVisible();
  await s.show([p.getByRole("heading", { name: "You carry 2 gene changes" }), tested]);
  await s.hold(SETTLE);
  await expect(p.getByText("563", { exact: true })).toBeVisible();
  s.keep();
  await s.hold(6500);
  await s.finish();
});

test("pb Couple result, numbers settled", async ({ browser }) => {
  const s = await Scene.start(browser, "pb");
  const p = s.page;
  await s.as("Mariam", "/en/couple");
  // Off camera: both partners turn their keys, if the match has to run again.
  const key = p.getByRole("button", { name: "Turn my key" });
  await expect(key.or(p.getByRole("button", { name: "Reveal our result" })).or(p.getByRole("heading", { name: "Your shared carrier result" }))).toBeVisible({ timeout: 60_000 });
  if (await key.isVisible()) {
    await key.click();
    await expect(p.getByRole("heading", { name: "Your key is turned" })).toBeVisible({ timeout: 60_000 });
    await p.getByRole("button", { name: "Demo: switch to Khalid's phone" }).click();
    await p.getByRole("button", { name: "Turn my key" }).click();
    await expect(p.getByRole("heading", { name: "Your key is turned" })).toBeVisible({ timeout: 60_000 });
    await p.getByRole("button", { name: "Demo: switch to Mariam's phone" }).click();
    await p.waitForLoadState("networkidle").catch(() => undefined);
    await s.hold(800);
  }
  const reveal = p.getByRole("button", { name: "Reveal our result" });
  const shared = p.getByRole("heading", { name: "Your shared carrier result" });
  await expect(reveal.or(shared)).toBeVisible({ timeout: 60_000 });
  if (await reveal.isVisible()) {
    await s.show([p.locator("main h1").first(), reveal]);
    s.keep();
    await s.hold(800);
    await s.click(reveal, 0);
    await s.settle(() => expect(shared).toBeVisible());
  }
  // Off camera while the page scrolls and the numbers count up; filmed once they have stopped.
  s.cut();
  const combined = p.getByText("43.75%").first();
  await s.show([combined, p.getByText("You both carry a change in GJB2"), p.getByText("You both carry a change in HBB")]);
  await s.hold(SETTLE);
  await expect(p.getByText("25%", { exact: true }).first()).toBeVisible();
  s.keep();
  await s.hold(4200); // at least 3 seconds on screen after the speed up
  await s.show(p.locator("[data-your-plan=shared]"));
  await s.hold(2400);
  await s.finish();
});

test("pc Copilot in Arabic, full answer", async ({ browser }) => {
  const s = await Scene.start(browser, "pc");
  const p = s.page;
  const q = "ما معنى أن أكون حاملة لتغيّر جيني؟";
  await s.as("Mariam", "/ar/copilot");
  await s.show(p.locator("#copilot-q"));
  s.keep();
  await s.hold(500);
  await s.type(p.locator("#copilot-q"), q, 25);
  await p.keyboard.press("Enter");
  await s.hold(300);
  s.cut();
  const answer = p.locator("[data-copilot-answer]").first();
  await expect(answer).toBeVisible({ timeout: 120_000 });
  await expect(answer).not.toContainText("[");
  await s.hold(2000);
  await s.show([p.locator("p").filter({ hasText: q }).first(), answer.locator("p").first(), answer.locator("p").last()]);
  s.keep();
  await s.hold(7500); // at least 4 seconds on screen after the speed up
  await s.finish();
});

test("pd Family Risk Engine with relatives", async ({ browser }) => {
  const s = await Scene.start(browser, "pd");
  const p = s.page;
  await s.as("Khalid", "/en/family?gene=HBB");
  await expect(p.locator("[data-relative]")).not.toHaveCount(0);
  const graph = p.locator("figure").first();
  await s.show([graph, p.getByText("Most worth offering a test")]);
  s.keep();
  await s.hold(7500);
  await s.finish();
});
