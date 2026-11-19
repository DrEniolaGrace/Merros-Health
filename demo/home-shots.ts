import { chromium, devices } from "@playwright/test";
const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = process.argv[3] ?? "demo/out/check";
async function shoot(b: import("@playwright/test").Browser, opts: object, path: string, url: string) {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(2500);
  // Scroll through so every section reveals, then back to the top.
  const h = await p.evaluate(() => document.body.scrollHeight);
  // Real wheel scrolling (the site scrolls smoothly, so jumps would not move it).
  for (let y = 0; y < h; y += 300) { await p.mouse.wheel(0, 300); await p.waitForTimeout(150); }
  await p.waitForTimeout(1200);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
  await p.waitForTimeout(800);
  await p.screenshot({ path, fullPage: true });
  await ctx.close();
}
(async () => {
  const b = await chromium.launch();
  await shoot(b, { viewport: { width: 1440, height: 900 }, locale: "en-GB" }, `${OUT}/home-desktop.png`, `${BASE}/en`);
  await shoot(b, { ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, locale: "en-GB" }, `${OUT}/home-phone.png`, `${BASE}/en`);
  await shoot(b, { ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, locale: "ar" }, `${OUT}/home-phone-ar.png`, `${BASE}/ar`);
  await b.close();
  console.log("ok");
})();
