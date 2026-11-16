/**
 * Clean screenshots of every key screen, for slides: desktop and mobile, English and Arabic.
 * Runs after the scenes, so the screens show the story's final state.
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { BASE } from "./director";

const DIR = path.resolve("docs/screenshots");
const VIEWS = {
  desktop: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
} as const;
const HIDE = `[data-judge-tour-button] { display: none !important; } * { caret-color: transparent !important; }`;

interface Shot {
  n: string;
  name: string;
  persona?: string;
  path: string;
  /** Optional steps after the page opens; may scroll to the part worth showing. */
  prep?: (page: Page) => Promise<void>;
}

const top = (sel: string) => async (page: Page) => {
  await page.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: "start" }));
  // Leave room for the sticky top bar, which is taller on a phone.
  await page.evaluate(() => window.scrollBy(0, -((document.querySelector("header")?.getBoundingClientRect().height ?? 64) + 24)));
};

const SHOTS: Shot[] = [
  { n: "01", name: "landing", path: "/" },
  {
    n: "02",
    name: "consent",
    persona: "Aisha",
    path: "",
    prep: async (page) => {
      for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /Continue|متابعة/ }).first().click();
      await page.waitForTimeout(700);
    },
  },
  { n: "03", name: "result", persona: "Khalid", path: "/result" },
  { n: "04", name: "your-plan", persona: "Khalid", path: "/result", prep: top("[data-your-plan]") },
  { n: "05", name: "teach-back", persona: "Khalid", path: "/teach-back" },
  {
    n: "06",
    name: "copilot",
    persona: "Khalid",
    path: "/copilot",
    prep: async (page) => {
      await page.locator("ul button").first().click();
      await expect(page.locator("[data-copilot-answer]").first()).toBeVisible({ timeout: 120_000 });
      await top("[data-copilot-answer]")(page);
    },
  },
  {
    n: "07",
    name: "shared-carrier-result",
    persona: "Mariam",
    path: "/couple",
    prep: async (page) => {
      // The match keys live on each phone, so this browser runs the match itself first.
      if (await page.getByRole("button", { name: /Turn my key|أدِر مفتاحي/ }).isVisible().catch(() => false)) {
        const back = new URL(page.url()).pathname; // /en/couple or /ar/couple
        await page.goto("/en/couple");
        await page.getByRole("button", { name: "Turn my key" }).click();
        await expect(page.getByRole("heading", { name: "Your key is turned" })).toBeVisible();
        await page.getByRole("button", { name: "Demo: switch to Khalid's phone" }).click();
        await page.getByRole("button", { name: "Turn my key" }).click();
        await expect(page.getByRole("heading", { name: "Your key is turned" })).toBeVisible();
        await page.getByRole("button", { name: "Demo: switch to Mariam's phone" }).click();
        await expect(page.getByRole("heading", { name: "Your private match is ready" })).toBeVisible();
        await page.goto(back);
        await page.waitForLoadState("networkidle").catch(() => undefined);
      }
      const reveal = page.getByRole("button", { name: /Reveal our result|اكشف/ });
      if (await reveal.isVisible().catch(() => false)) await reveal.click();
      await page.locator("[data-shared-carrier-result]").first().waitFor({ timeout: 30_000 });
      await top("[data-shared-carrier-result]")(page);
    },
  },
  { n: "08", name: "values-compass", persona: "Khalid", path: "/values" },
  { n: "09", name: "family", persona: "Khalid", path: "/family?gene=HBB" },
  { n: "10", name: "find-care", persona: "Khalid", path: "/find-care", prep: async (page) => page.waitForTimeout(2500) },
  { n: "11", name: "counsellor-brief", persona: "Dr. Layla Haddad", path: "/counsellor/open/hamad" },
  { n: "12", name: "living-results", persona: "Hamad", path: "/result" },
  { n: "13", name: "risk-beyond-the-panel", persona: "Dr. Layla Haddad", path: "/counsellor/open/khalid", prep: top("[data-counsellor-beyond]") },
  { n: "14", name: "population-signals", persona: "Programme Admin", path: "/admin" },
  { n: "15", name: "my-result-video", persona: "Khalid", path: "/video", prep: async (page) => page.waitForTimeout(3500) },
  { n: "16", name: "about-and-sources", path: "/sources" },
];

async function signIn(page: Page, persona: string) {
  await page.goto("/en/login");
  // Wait until the page is ready, click once, then wait patiently (the dev database can be slow).
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: `Continue as ${persona}` }).click();
  await expect(page).toHaveURL(/\/(home|counsellor|admin|onboarding)/, { timeout: 90_000 });
}

async function capture(browser: Browser, lang: "en" | "ar", view: keyof typeof VIEWS) {
  const ctx = await browser.newContext({ ...VIEWS[view], baseURL: BASE });
  await ctx.addInitScript((css) => {
    addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
    });
  }, HIDE);
  const page = await ctx.newPage();
  page.setDefaultTimeout(45_000);
  fs.mkdirSync(DIR, { recursive: true });
  let current: string | undefined;
  for (const shot of SHOTS) {
    if (shot.persona && shot.persona !== current) {
      await signIn(page, shot.persona);
      current = shot.persona;
    }
    // Onboarding has no locale prefix of its own: the persona lands on it after sign in.
    if (shot.name === "consent") await page.goto(`/${lang}/onboarding`);
    else await page.goto(`/${lang}${shot.path === "/" ? "" : shot.path}`);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(1200); // entrance animations
    if (shot.prep) await shot.prep(page);
    // Numbers count up when they come into view; wait until they show their final value.
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(DIR, `${lang}-${view}-${shot.n}-${shot.name}.png`) });
  }
  await ctx.close();
}

test.describe.configure({ mode: "serial" });
for (const lang of ["en", "ar"] as const) {
  for (const view of ["desktop", "mobile"] as const) {
    test(`screenshots ${lang} ${view}`, async ({ browser }) => {
      test.setTimeout(15 * 60_000);
      await capture(browser, lang, view);
    });
  }
}
