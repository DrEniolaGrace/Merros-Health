/**
 * Helpers for recording the demo at a calm, human pace: a visible cursor that glides to each
 * target, slow typing, smooth scrolling and pauses. Each scene records its own clip and notes
 * which parts to keep (waiting for the AI is cut out later by the video assembly).
 */
import fs from "node:fs";
import path from "node:path";
import { expect, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";

export const SIZE = { width: 1920, height: 1080 };
/**
 * The page is shown at 150%: it lays out like a 1280 x 720 laptop screen (the app has no wider
 * layouts), and is drawn at the full 1920 x 1080 of the video, so the interface is large and sharp.
 * (Playwright records at the window's own size, so a device scale factor would not help.)
 */
export const ZOOM = 1.5;
/** Space kept around whatever a scene is showing. */
const MARGIN = 48;
export const OUT = path.resolve("demo/out");
export const CLIPS = path.join(OUT, "public", "clips");
export const BASE = process.env.DEMO_BASE_URL ?? "http://localhost:3100";

/** A soft cursor dot (Playwright's video does not show the real pointer) and no Judge Tour button. */
const STAGE = `
(() => {
  document.documentElement.style.zoom = "${ZOOM}";
  const css = \`
    [data-judge-tour-button] { display: none !important; }
    #demo-cursor { position: fixed; left: 0; top: 0; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%;
      background: rgba(240,166,184,0.85); box-shadow: 0 0 0 3px rgba(255,255,255,0.55), 0 0 24px 4px rgba(194,65,95,0.55);
      pointer-events: none; z-index: 2147483647; transition: transform 90ms ease-out; }
    #demo-cursor.down { transform: scale(0.7); }
    .demo-ripple { position: fixed; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; pointer-events: none;
      z-index: 2147483646; border: 2px solid rgba(226,201,143,0.9); animation: demo-ripple 650ms ease-out forwards; }
    @keyframes demo-ripple { to { transform: scale(3.2); opacity: 0; } }
    html { scroll-behavior: smooth; }
  \`;
  const add = () => {
    if (document.getElementById("demo-cursor")) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const c = document.createElement("div");
    c.id = "demo-cursor";
    c.style.left = (window.__demoX ?? innerWidth / 2) + "px";
    c.style.top = (window.__demoY ?? innerHeight / 2) + "px";
    document.body.appendChild(c);
  };
  addEventListener("mousemove", (e) => {
    const c = document.getElementById("demo-cursor");
    if (c) { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }
  }, true);
  addEventListener("mousedown", (e) => {
    document.getElementById("demo-cursor")?.classList.add("down");
    const r = document.createElement("div");
    r.className = "demo-ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
    document.body.appendChild(r); setTimeout(() => r.remove(), 700);
  }, true);
  addEventListener("mouseup", () => document.getElementById("demo-cursor")?.classList.remove("down"), true);
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", add); else add();
})();
`;

export class Scene {
  private segments: { from: number; to: number }[] = [];
  private open: number | null = null;
  private t0 = 0;
  private constructor(
    readonly key: string,
    readonly ctx: BrowserContext,
    readonly page: Page,
  ) {}

  static async start(browser: Browser, key: string): Promise<Scene> {
    fs.mkdirSync(CLIPS, { recursive: true });
    const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: path.join(OUT, "raw"), size: SIZE }, baseURL: BASE, locale: "en-GB" });
    await ctx.addInitScript(STAGE);
    const page = await ctx.newPage();
    const s = new Scene(key, ctx, page);
    s.t0 = Date.now(); // the video starts when the page is created
    page.setDefaultTimeout(45_000);
    return s;
  }

  private now() {
    return Date.now() - this.t0;
  }

  /** Start (or resume) keeping footage. Everything before the first call is set up and is cut. */
  keep() {
    if (this.open === null) this.open = this.now();
  }

  /** Stop keeping footage, for example while the AI is composing an answer. */
  cut() {
    if (this.open !== null) this.segments.push({ from: this.open, to: this.now() });
    this.open = null;
  }

  /**
   * Waits for the app (saving, loading a page) without keeping the wait in the video: the click and
   * a moment of the busy button stay, the waiting is cut, and the result appears straight after.
   */
  async settle(done: () => Promise<unknown>, lead = 450) {
    await this.hold(lead);
    const wasOpen = this.open !== null;
    this.cut();
    await done();
    await this.hold(350);
    if (wasOpen) this.keep();
  }

  async hold(ms = 2500) {
    await this.page.waitForTimeout(ms);
  }

  /** Signs in as a persona off camera and opens a page. */
  async as(persona: string, pathname: string, home = /\/(home|counsellor|admin|onboarding)/) {
    const wasOpen = this.open !== null;
    this.cut();
    const p = this.page;
    await p.goto("/en/login");
    // Wait until the page is fully ready (a click in the first instant can be dropped), click once,
    // then wait patiently: sign in against the hosted dev database can take several seconds.
    await p.waitForLoadState("networkidle").catch(() => undefined);
    await this.hold(800);
    await p.getByRole("button", { name: `Continue as ${persona}` }).click();
    await expect(p).toHaveURL(home, { timeout: 90_000 });
    if (pathname) await p.goto(pathname);
    await p.waitForLoadState("networkidle").catch(() => undefined);
    await this.hold(600); // let entrance animations finish before the camera rolls
    if (wasOpen) this.keep();
  }

  async go(pathname: string) {
    await this.page.goto(pathname);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.hold(500);
  }

  /** Bottom of the sticky header (in video pixels), so nothing is framed underneath it. */
  private async topInset(): Promise<number> {
    const header = this.page.locator("header").first();
    if (!(await header.count())) return 0;
    const sticky = await header.evaluate((el) => ["sticky", "fixed"].includes(getComputedStyle(el).position)).catch(() => false);
    const b = sticky ? await header.boundingBox() : null;
    return b ? Math.max(0, b.y + b.height) : 0;
  }

  private async union(targets: Locator[]) {
    const boxes = [];
    for (const t of targets) {
      const b = await t.first().boundingBox();
      if (b) boxes.push(b);
    }
    if (!boxes.length) throw new Error(`${this.key}: nothing to show`);
    const top = Math.min(...boxes.map((b) => b.y));
    const bottom = Math.max(...boxes.map((b) => b.y + b.height));
    const left = Math.min(...boxes.map((b) => b.x));
    const right = Math.max(...boxes.map((b) => b.x + b.width));
    return { top, bottom, left, right, height: bottom - top };
  }

  /**
   * Smoothly scrolls so the element (or all the elements together) sits fully inside the frame,
   * below the header, with space around it: centred when it fits, from its top when it is taller
   * than the screen. Positions come from the elements themselves, never fixed coordinates.
   * With `strict` (the default) the recording stops if the element still does not fit.
   */
  async show(targets: Locator | Locator[], opts: { strict?: boolean } = {}) {
    const list = Array.isArray(targets) ? targets : [targets];
    for (const t of list) await t.first().waitFor({ state: "visible" });
    const inset = await this.topInset();
    const free = SIZE.height - inset - 2 * MARGIN;
    const target = async () => {
      const u = await this.union(list);
      const want = u.height <= free ? inset + MARGIN + (free - u.height) / 2 : inset + MARGIN;
      return { u, delta: u.top - want };
    };
    let { delta } = await target();
    if (Math.abs(delta) > 4) {
      await this.page.evaluate((dy) => window.scrollBy({ top: dy, behavior: "smooth" }), delta / ZOOM);
      await this.hold(1000);
      // Pages that cannot scroll further, or that moved while loading, are corrected once, instantly.
      ({ delta } = await target());
      if (Math.abs(delta) > 6) {
        await this.page.evaluate((dy) => window.scrollBy({ top: dy }), delta / ZOOM);
        await this.hold(200);
      }
    }
    await this.hold(250);
    if (opts.strict !== false) {
      const { u } = await target();
      const fits = u.height <= free ? u.top >= inset - 2 && u.bottom <= SIZE.height + 2 : u.top >= inset - 2;
      if (!fits || u.left < -2 || u.right > SIZE.width + 2) {
        throw new Error(`${this.key}: could not frame the element (top ${Math.round(u.top)}, bottom ${Math.round(u.bottom)}, left ${Math.round(u.left)}, right ${Math.round(u.right)}, header ${Math.round(inset)})`);
      }
    }
  }

  async scrollBy(px: number) {
    await this.page.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), px);
    await this.hold(1100);
  }

  /** Glides the cursor to the element in small steps, like a hand on a mouse. */
  async glide(target: Locator) {
    const el = target.first();
    await el.waitFor({ state: "visible" });
    const box = await el.boundingBox();
    const inset = await this.topInset();
    if (!box || box.y < inset + 20 || box.y + box.height > SIZE.height - 40) {
      await this.show(el, { strict: false });
    }
    const b = (await el.boundingBox())!;
    await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
    await this.hold(150);
  }

  async click(target: Locator, after = 700) {
    await this.glide(target);
    await target.first().click();
    await this.hold(after);
  }

  async type(target: Locator, text: string, delay = 45) {
    await this.click(target, 200);
    await target.first().pressSequentially(text, { delay });
    await this.hold(500);
  }

  /** Closes the clip and saves it with the list of kept parts. */
  async finish() {
    this.cut();
    const video = this.page.video();
    await this.ctx.close();
    const src = await video!.path();
    const dest = path.join(CLIPS, `${this.key}.webm`);
    fs.copyFileSync(src, dest);
    fs.writeFileSync(path.join(CLIPS, `${this.key}.json`), JSON.stringify({ key: this.key, segments: this.segments }, null, 1));
  }
}
