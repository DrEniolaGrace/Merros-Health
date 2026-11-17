import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, name: string, home: RegExp) {
  await page.goto("/en/login");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.getByRole("button", { name: `Continue as ${name}` }).click();
  await expect(page).toHaveURL(home, { timeout: 60_000 });
}

/** Every patient page, and the group it belongs to (Home and Privacy stand alone). */
const PAGES: { key: string; path: string; group: string | null }[] = [
  { key: "home", path: "/home", group: null },
  { key: "result", path: "/result", group: "result" },
  { key: "video", path: "/video", group: "result" },
  { key: "learn", path: "/learn", group: "result" },
  { key: "wellbeing", path: "/wellbeing", group: "result" },
  { key: "couple", path: "/couple", group: "together" },
  { key: "options", path: "/options", group: "together" },
  { key: "values", path: "/values", group: "together" },
  { key: "family", path: "/family", group: "family" },
  { key: "copilot", path: "/copilot", group: "care" },
  { key: "care", path: "/support", group: "care" },
  { key: "findCare", path: "/find-care", group: "care" },
  { key: "pathway", path: "/pathway", group: "care" },
  { key: "screening", path: "/screening", group: "screening" },
  { key: "privacy", path: "/privacy", group: null },
];

test("Desktop: five groups, only the one in use is open, and every page is in the menu", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await loginAs(page, "Khalid", /\/en\/home/);
  const rail = page.locator("[data-nav-rail]");
  // On Home, every group is collapsed.
  for (const g of ["result", "together", "care"]) await expect(rail.locator(`[data-nav-group=${g}]`)).toHaveAttribute("data-open", "false");

  await page.goto("/en/values");
  await expect(rail.locator("[data-nav-group=together]")).toHaveAttribute("data-open", "true");
  await expect(rail.locator("[data-nav-group=result]")).toHaveAttribute("data-open", "false");
  await expect(rail.locator("[data-nav-item=values]")).toHaveAttribute("aria-current", "page");

  // Opening a group shows its pages; following one opens that group instead.
  await rail.locator("[data-nav-group=care] button").click();
  await rail.locator("[data-nav-item=findCare]").click();
  await expect(page).toHaveURL(/\/en\/find-care/);
  await expect(rail.locator("[data-nav-group=care]")).toHaveAttribute("data-open", "true");
  await expect(rail.locator("[data-nav-group=together]")).toHaveAttribute("data-open", "false");

  // Every page can be reached from the menu.
  for (const pg of PAGES) {
    const group = pg.group && pg.group !== "family" && pg.group !== "screening" ? rail.locator(`[data-nav-group=${pg.group}]`) : null;
    if (group && (await group.getAttribute("data-open")) === "false") await group.locator("button").click();
    await expect(rail.locator(`[data-nav-item=${pg.key}]`), pg.key).toBeVisible();
  }
  await ctx.close();
});

test("Phone: Home, three groups and More, with every page reachable", async ({ page }) => {
  await loginAs(page, "Khalid", /\/en\/home/);
  const bar = page.getByRole("navigation", { name: "Main" });
  await expect(bar.locator("[data-bottom]")).toHaveCount(5);
  const reach = new Set<string>(["home"]);
  for (const slot of ["result", "together", "care", "more"]) {
    await bar.locator(`[data-bottom=${slot}]`).click();
    const sheet = page.locator("[data-nav-sheet]");
    await expect(sheet).toBeVisible();
    for (const key of await sheet.locator("[data-nav-item]").evaluateAll((els) => els.map((e) => e.getAttribute("data-nav-item")!))) reach.add(key);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  }
  expect([...reach].sort()).toEqual(PAGES.map((p) => p.key).sort());

  // Following a link from a group opens the page and closes the list.
  await bar.locator("[data-bottom=together]").click();
  await page.locator("[data-nav-sheet] [data-nav-item=values]").click();
  await expect(page).toHaveURL(/\/en\/values/);
  await expect(page.locator("[data-nav-sheet]")).toHaveCount(0);
});
