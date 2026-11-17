import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Files and folders a person reads: the app's text, its content, and the documentation. */
const ROOTS = ["messages", "content", "app", "components", "docs", "demo/captions.json", "README.md", "SPEC.md", "DESIGN.md", "CLAUDE.md"];

function files(p: string): string[] {
  if (!fs.existsSync(p)) return [];
  if (fs.statSync(p).isFile()) return [p];
  return fs.readdirSync(p).flatMap((f) => files(path.join(p, f)));
}

describe("the name", () => {
  it('is spelled "Merros" everywhere a person can read it', () => {
    const found: string[] = [];
    for (const f of ROOTS.flatMap(files).filter((f) => /\.(tsx?|json|md|css)$/.test(f))) {
      const text = fs.readFileSync(f, "utf8");
      if (/\bMeros\b|\bMEROS\b/.test(text)) found.push(f);
    }
    expect(found).toEqual([]);
  });

  it("the logo is shipped", () => {
    for (const f of ["public/brand/merros-mark.png", "app/icon.png", "app/apple-icon.png"]) expect(fs.existsSync(f), f).toBe(true);
  });
});
