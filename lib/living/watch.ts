/**
 * Living Results, pure logic (SPEC 6.3): compare stored classifications with a feed and decide
 * what changed. No I/O here, so it is fully unit tested.
 */
import type { AcmgClass, Variant } from "@/lib/risk/types";

export interface FeedEntry {
  clinvarId: string;
  gene: string;
  hgvs: string;
  classification: AcmgClass;
  source: "clinvar" | "national_feed_mock";
  evidence: string;
}

/** Maps a ClinVar germline classification description to the five ACMG classes. */
export function normaliseClinvarClass(description: string | null | undefined): AcmgClass | null {
  const d = (description ?? "").trim().toLowerCase();
  if (!d) return null;
  if (d.includes("conflicting")) return "vus";
  if (d === "pathogenic" || d.startsWith("pathogenic,")) return "pathogenic";
  if (d === "pathogenic/likely pathogenic" || d === "likely pathogenic") return "likely_pathogenic";
  if (d.includes("uncertain")) return "vus";
  if (d === "benign/likely benign" || d === "likely benign") return "likely_benign";
  if (d === "benign") return "benign";
  return null;
}

export interface Change {
  entry: FeedEntry;
  oldClass: AcmgClass;
  newClass: AcmgClass;
}

/** Feed entries whose classification differs from what a person's result says. */
export function changesFor(variants: Variant[], feed: FeedEntry[]): Change[] {
  const out: Change[] = [];
  for (const entry of feed) {
    const v = variants.find((x) => x.clinvarId === entry.clinvarId);
    if (v && v.acmg !== entry.classification) out.push({ entry, oldClass: v.acmg, newClass: entry.classification });
  }
  return out;
}

/** The person's variants with the new classification applied (for the lab's amended report). */
export function amend(variants: Variant[], change: Change): Variant[] {
  return variants.map((v) => (v.clinvarId === change.entry.clinvarId ? { ...v, acmg: change.newClass } : v));
}

/** Does this change matter for carrier status (crosses the pathogenic / not pathogenic line)? */
export function changesCarrierStatus(change: Change): boolean {
  const pl = (c: AcmgClass) => c === "pathogenic" || c === "likely_pathogenic";
  return pl(change.oldClass) !== pl(change.newClass);
}
