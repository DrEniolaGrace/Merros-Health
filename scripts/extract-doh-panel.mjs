// Extracts Appendix 12 (pages 46 and 47) cell by cell, using text positions so that a bracketed
// older name is attached to the gene printed above it in the same column. Then maps every name
// to the current HGNC symbol. Writes genes.json. Read only: nothing in the project is changed.
import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [, , pdfPath, hgncPath, outPath] = process.argv;
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), useSystemFonts: true }).promise;

const cells = []; // { page, x, y, text }
for (const pageNo of [46, 47]) {
  const page = await doc.getPage(pageNo);
  const tc = await page.getTextContent();
  for (const it of tc.items) {
    if (!("str" in it)) continue;
    const t = it.str.trim();
    if (!t) continue;
    cells.push({ page: pageNo, x: it.transform[4], y: it.transform[5], w: it.width, text: t });
  }
}

// Split items that hold several tokens ("CBLIF (GIF)", "HJV (HFE2)") into gene and alias parts.
const tokens = [];
for (const c of cells) {
  if (/Appendix|List of tested|^\d+$|doesn|include|linked|AR diseases/i.test(c.text)) continue;
  const parts = c.text.match(/\(?[A-Za-z0-9-]+\*?\)?/g) ?? [];
  let x = c.x;
  for (const p of parts) {
    tokens.push({ page: c.page, x, y: c.y, text: p });
    x += 1; // keeps the order of parts within one item
  }
}

// Attach each "(ALIAS)" to the nearest gene above it in the same column, or to the gene just before it on the same line.
const genes = [];
const isAlias = (t) => /^\(.*\)$/.test(t.text);
const sameLineBefore = (a, g) => g.page === a.page && Math.abs(g.y - a.y) < 2 && g.x < a.x;
const above = (a, g) => g.page === a.page && Math.abs(g.x - a.x) < 25 && g.y > a.y && g.y - a.y < 22;
for (const t of tokens.filter((t) => !isAlias(t))) genes.push({ ...t, symbol: t.text.replace(/\*$/, ""), star: t.text.endsWith("*"), aliases: [] });
const unattached = [];
for (const a of tokens.filter(isAlias)) {
  const name = a.text.slice(1, -1);
  const inline = genes.filter((g) => sameLineBefore(a, g)).sort((p, q) => q.x - p.x)[0];
  const cand = inline ?? genes.filter((g) => above(a, g)).sort((p, q) => p.y - a.y - (q.y - a.y))[0];
  if (cand) cand.aliases.push(name);
  else unattached.push(name);
}

// HGNC table: approved symbol, previous symbols, alias symbols.
const rows = fs.readFileSync(hgncPath, "utf8").split("\n");
const head = rows[0].split("\t");
const col = (n) => head.indexOf(n);
const [iSym, iPrev, iAlias, iStatus] = [col("symbol"), col("prev_symbol"), col("alias_symbol"), col("status")];
const approved = new Set();
const prevTo = new Map();
const aliasTo = new Map();
for (const r of rows.slice(1)) {
  const f = r.split("\t");
  if (!f[iSym] || f[iStatus] !== "Approved") continue;
  approved.add(f[iSym]);
  for (const p of (f[iPrev] || "").replace(/"/g, "").split("|").filter(Boolean)) prevTo.set(p, [...(prevTo.get(p) ?? []), f[iSym]]);
  for (const p of (f[iAlias] || "").replace(/"/g, "").split("|").filter(Boolean)) aliasTo.set(p, [...(aliasTo.get(p) ?? []), f[iSym]]);
}

function mapSymbol(s) {
  if (approved.has(s)) return { current: s, how: "approved" };
  const prev = prevTo.get(s) ?? [];
  if (prev.length === 1) return { current: prev[0], how: "previous symbol" };
  if (prev.length > 1) return { current: null, how: `previous symbol of several: ${prev.join(", ")}` };
  const al = aliasTo.get(s) ?? [];
  if (al.length === 1) return { current: al[0], how: "alias" };
  if (al.length > 1) return { current: null, how: `alias of several: ${al.join(", ")}` };
  return { current: null, how: "not found" };
}

const byCurrent = new Map();
const unmapped = [];
const renamed = [];
for (const g of genes) {
  const m = mapSymbol(g.symbol);
  if (!m.current) {
    unmapped.push({ printed: g.symbol, why: m.how });
    continue;
  }
  if (m.current !== g.symbol) renamed.push({ printed: g.symbol, current: m.current, how: m.how });
  const e = byCurrent.get(m.current) ?? { symbol: m.current, aliases: new Set(), printed: [], star: false };
  if (g.symbol !== m.current) e.aliases.add(g.symbol);
  for (const a of g.aliases) if (a !== m.current) e.aliases.add(a);
  e.printed.push(g.symbol + (g.aliases.length ? ` (${g.aliases.join(", ")})` : ""));
  e.star = e.star || g.star;
  byCurrent.set(m.current, e);
}
const list = [...byCurrent.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)).map((e) => ({ symbol: e.symbol, aliases: [...e.aliases].sort(), printed: e.printed, ...(e.star ? { footnote: true } : {}) }));
const dupes = list.filter((e) => e.printed.length > 1).map((e) => `${e.symbol}: ${e.printed.join(" + ")}`);
fs.writeFileSync(outPath, JSON.stringify({ printedEntries: genes.length, unique: list.length, renamed, unmapped, unattached, dupes, genes: list }, null, 1));
console.log("printed entries:", genes.length, "| unique current symbols:", list.length, "| renamed:", renamed.length, "| unmapped:", unmapped.length, "| unattached aliases:", unattached.length);
console.log("renamed:", renamed.map((r) => `${r.printed}->${r.current}`).join(", "));
console.log("duplicates merged:", dupes.join(" | "));
console.log("unmapped:", JSON.stringify(unmapped));
console.log("unattached:", JSON.stringify(unattached));
console.log("with aliases:", list.filter((e) => e.aliases.length).map((e) => `${e.symbol}(${e.aliases.join("/")})`).join(", "));
console.log("footnote *:", list.filter((e) => e.footnote).map((e) => e.symbol).join(","));
