import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { amend, changesCarrierStatus, changesFor, normaliseClinvarClass, type FeedEntry } from "@/lib/living/watch";
import { summarisePerson } from "@/lib/risk/engine";
import { evaluateEscalation, emptyContext } from "@/lib/escalation/rules";
import { persona } from "@/content/personas";

const feed = JSON.parse(readFileSync("data/reference/reclassification-feed.json", "utf8")) as FeedEntry[];

describe("ClinVar classification mapping", () => {
  it.each([
    ["Pathogenic", "pathogenic"],
    ["Pathogenic/Likely pathogenic", "likely_pathogenic"],
    ["Likely pathogenic", "likely_pathogenic"],
    ["Uncertain significance", "vus"],
    ["Conflicting classifications of pathogenicity", "vus"],
    ["Likely benign", "likely_benign"],
    ["Benign/Likely benign", "likely_benign"],
    ["Benign", "benign"],
  ])("%s -> %s", (d, c) => expect(normaliseClinvarClass(d)).toBe(c));
  it("unknown or empty descriptions are ignored, never guessed", () => {
    expect(normaliseClinvarClass("")).toBeNull();
    expect(normaliseClinvarClass(undefined)).toBeNull();
    expect(normaliseClinvarClass("drug response")).toBeNull();
  });
});

describe("detecting a reclassification", () => {
  const hamad = persona("hamad").variants!;
  it("Hamad's VUS is found in the mock feed as likely pathogenic", () => {
    const [c] = changesFor(hamad, feed);
    expect(c).toMatchObject({ oldClass: "vus", newClass: "likely_pathogenic" });
    expect(changesCarrierStatus(c)).toBe(true);
  });
  it("people without the variant are not affected", () => {
    expect(changesFor(persona("noura").variants!, feed)).toEqual([]);
    expect(changesFor(persona("khalid").variants!, feed)).toEqual([]);
  });
  it("Mariam's CFTR VUS moves to likely benign (simulated), which does not make her a CF carrier", () => {
    const changes = changesFor(persona("mariam").variants!, feed);
    expect(changes).toHaveLength(1);
    expect(changes[0].entry.clinvarId).toBe("5034488");
    expect(changes[0].entry.classification).toBe("likely_benign");
    expect(changesCarrierStatus(changes[0])).toBe(false);
  });
  it("no change when the classification is already the same", () => {
    const [c] = changesFor(hamad, feed);
    expect(changesFor(amend(hamad, c), feed)).toEqual([]);
  });
  it("a pathogenic to likely pathogenic change does not change carrier status", () => {
    const v = persona("mariam").variants!;
    const [c] = changesFor(v, [{ ...feed[0], clinvarId: v[0].clinvarId!, classification: "likely_pathogenic" }]);
    expect(changesCarrierStatus(c)).toBe(false);
  });
});

describe("the chain after reclassification", () => {
  const hamad = persona("hamad").variants!;
  const [c] = changesFor(hamad, feed);
  const amended = amend(hamad, c);
  it("before: no carrier gene, one VUS, escalated for the VUS", () => {
    const s = summarisePerson(hamad);
    expect(s.genes).toEqual([]);
    expect(s.vus).toHaveLength(1);
    expect(evaluateEscalation(emptyContext({ ownVariants: hamad })).map((e) => e.code)).toEqual(["vus_present"]);
  });
  it("after: the risk engine now treats him as an HBB carrier", () => {
    const s = summarisePerson(amended);
    expect(s.genes.map((g) => [g.gene, g.status.kind])).toEqual([["HBB", "carrier"]]);
    expect(s.vus).toEqual([]);
  });
  it("the reclassification escalation fires with high severity", () => {
    const fired = evaluateEscalation(emptyContext({ ownVariants: amended, variantReclassified: true }));
    expect(fired).toEqual([{ code: "variant_reclassified", severity: "high" }]);
  });
  it("the original variants are not mutated", () => expect(hamad[0].acmg).toBe("vus"));
});
