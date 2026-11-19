/**
 * Builds docs/Merros_Technical_Documentation.pdf from doc.html with the project's browser.
 * Run: npx tsx docs/technical-documentation/build-pdf.ts
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

async function main() {
  const dir = path.join(process.cwd(), "docs", "technical-documentation");
  const logo = fs.readFileSync(path.join(process.cwd(), "public", "brand", "merros-mark.png")).toString("base64");
  const html = fs.readFileSync(path.join(dir, "doc.html"), "utf8").replace("{{LOGO}}", `data:image/png;base64,${logo}`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  // Keep every subheading on the same page as what follows it (no heading alone at the bottom of a page).
  await page.evaluate(() => {
    for (const h of Array.from(document.querySelectorAll("h3"))) {
      const next = h.nextElementSibling;
      if (!next || h.parentElement?.classList.contains("keep")) continue;
      // Short content moves with its heading; long content (a big table) may start on the same page.
      if (next.getBoundingClientRect().height > 260) continue;
      const wrap = document.createElement("div");
      wrap.className = "keep";
      h.before(wrap);
      wrap.append(h, next);
    }
  });
  await page.evaluate(() => {
    for (const h of Array.from(document.querySelectorAll(".section > h2"))) {
      const parts: Element[] = [h];
      let n = h.nextElementSibling;
      if (n?.classList.contains("lead")) { parts.push(n); n = n.nextElementSibling; }
      if (n && n.getBoundingClientRect().height < 260) parts.push(n);
      const wrap = document.createElement("div");
      wrap.className = "keep";
      h.before(wrap);
      wrap.append(...parts);
    }
  });
  const out = path.join(process.cwd(), "docs", "Merros_Technical_Documentation.pdf");
  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;font-size:8px;color:#8a7a80;padding:0 18mm;display:flex;justify-content:space-between;font-family:Segoe UI,Arial"><span>Merros · Technical documentation · Synthetic data only</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  await browser.close();
  const pages = (fs.readFileSync(out, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`Saved ${path.relative(process.cwd(), out)}: ${pages} pages`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
