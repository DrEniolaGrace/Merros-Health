import { describe, expect, it } from "vitest";
import {
  assess,
  AUTOSOME_MB,
  band,
  childInbreeding,
  consistency,
  extraRisk,
  FIRST_COUSIN_EXTRA,
  froh,
  GENOME_MB,
  kinshipFromShared,
  PEDIGREE_KINSHIP,
  RELATIONSHIPS,
  totalMb,
  validateSegments,
  type Segment,
} from "@/lib/beyond/engine";
import dataset from "@/data/reference/beyond-panel.json";
import { emptyContext, evaluateEscalation } from "@/lib/escalation/rules";

const seg = (chr: number, startMb: number, endMb: number): Segment => ({ chr, startMb, endMb });
/** Segments covering `share` of the genome, spread over the autosomes. */
function covering(share: number): Segment[] {
  return Object.entries(AUTOSOME_MB).map(([c, len]) => seg(Number(c), 0, len * share));
}

describe("Risk Beyond the Panel engine", () => {
  it("knows the autosomes", () => {
    expect(Object.keys(AUTOSOME_MB)).toHaveLength(22);
    expect(GENOME_MB).toBe(2872);
  });

  it("pedigree kinship values are the textbook fractions", () => {
    expect(PEDIGREE_KINSHIP.first_cousins).toBe(1 / 16);
    expect(PEDIGREE_KINSHIP.double_first_cousins).toBe(1 / 8);
    expect(PEDIGREE_KINSHIP.first_cousins_once_removed).toBe(1 / 32);
    expect(PEDIGREE_KINSHIP.second_cousins).toBe(1 / 64);
    expect(PEDIGREE_KINSHIP.unrelated).toBe(0);
  });

  it("kinship is the shared share of the genome divided by 4", () => {
    expect(kinshipFromShared([])).toBe(0);
    expect(kinshipFromShared(covering(0.25))).toBeCloseTo(1 / 16, 10); // first cousins share a quarter on one copy
    expect(kinshipFromShared(covering(0.5))).toBeCloseTo(1 / 8, 10);
    expect(totalMb([seg(1, 10, 30), seg(2, 0, 5.5)])).toBeCloseTo(25.5, 10);
  });

  it("a child's inbreeding coefficient equals the parents' kinship", () => {
    for (const r of RELATIONSHIPS) expect(childInbreeding(PEDIGREE_KINSHIP[r])).toBe(PEDIGREE_KINSHIP[r]);
  });

  it("rejects segments that are impossible", () => {
    expect(() => validateSegments([seg(23, 0, 5)])).toThrow();
    expect(() => validateSegments([seg(21, 40, 60)])).toThrow(); // chromosome 21 is 47 Mb
    expect(() => validateSegments([seg(1, 20, 10)])).toThrow();
    expect(() => validateSegments([seg(1, 0, 30), seg(1, 25, 40)])).toThrow(); // overlap
    expect(() => validateSegments([seg(1, 0, 30), seg(1, 30, 40), seg(2, 0, 10)])).not.toThrow();
  });

  it("FROH is the share of one genome in runs of homozygosity", () => {
    expect(froh(covering(0.0625))).toBeCloseTo(0.0625, 10);
  });

  it("extra risk for first cousins is the published range, and scales in proportion to F", () => {
    expect(extraRisk(1 / 16)).toEqual({ low: FIRST_COUSIN_EXTRA.low, high: FIRST_COUSIN_EXTRA.high, beyondRange: false });
    const half = extraRisk(1 / 32);
    expect(half.low).toBeCloseTo(0.0085, 10);
    expect(half.high).toBeCloseTo(0.014, 10);
    expect(extraRisk(0)).toEqual({ low: 0, high: 0, beyondRange: false });
  });

  it("does not extrapolate beyond twice the first cousin level", () => {
    const dbl = extraRisk(1 / 8);
    expect(dbl.beyondRange).toBe(false);
    expect(dbl.high).toBeCloseTo(0.056, 10);
    const more = extraRisk(0.2);
    expect(more.beyondRange).toBe(true);
    expect(more.high).toBeCloseTo(0.056, 10); // capped, not extended
    expect(() => extraRisk(-0.1)).toThrow();
    expect(() => extraRisk(0.6)).toThrow();
  });

  it("extra risk never decreases as sharing increases", () => {
    let prev = -1;
    for (let f = 0; f <= 0.25; f += 0.005) {
      const r = extraRisk(f);
      expect(r.low).toBeLessThanOrEqual(r.high);
      expect(r.high).toBeGreaterThanOrEqual(prev);
      prev = r.high;
    }
  });

  it("puts each relationship in a clear band", () => {
    expect(band(PEDIGREE_KINSHIP.unrelated)).toBe("background");
    expect(band(0.001)).toBe("background");
    expect(band(PEDIGREE_KINSHIP.second_cousins)).toBe("slightly_above");
    expect(band(PEDIGREE_KINSHIP.first_cousins_once_removed)).toBe("slightly_above");
    expect(band(PEDIGREE_KINSHIP.first_cousins)).toBe("moderately_above");
    expect(band(PEDIGREE_KINSHIP.double_first_cousins)).toBe("moderately_above");
    expect(band(0.2)).toBe("individual_assessment");
  });

  it("flags sharing that does not match the declared relationship, with room for natural variation", () => {
    expect(consistency("first_cousins", 0.0656)).toBe("consistent");
    expect(consistency("first_cousins", 0.05)).toBe("consistent");
    expect(consistency("first_cousins", 0.125)).toBe("more_than_declared");
    expect(consistency("first_cousins", 0.01)).toBe("less_than_declared");
    expect(consistency("unrelated", 0.001)).toBe("consistent");
    expect(consistency("unrelated", 0.06)).toBe("more_than_declared");
  });
});

describe("demonstration data", () => {
  const couples = (dataset as unknown as { couples: Record<string, { declared: (typeof RELATIONSHIPS)[number]; shared: Segment[] }> }).couples;

  it("is labelled synthetic and not pipeline output", () => {
    expect((dataset as { _about: string })._about).toMatch(/SYNTHETIC/);
    expect((dataset as { _about: string })._about).toMatch(/Not the output of a genomics pipeline/);
  });

  it("the first cousin couple measures close to 1/16 and lands in the moderate band", () => {
    const r = assess(couples["khalid-mariam"].declared, couples["khalid-mariam"].shared);
    expect(r.declared).toBe("first_cousins");
    expect(r.kinship).toBeGreaterThan(0.055);
    expect(r.kinship).toBeLessThan(0.07);
    expect(r.childF).toBe(r.kinship);
    expect(r.band).toBe("moderately_above");
    expect(r.consistency).toBe("consistent");
    expect(r.extra.low).toBeGreaterThan(0.015);
    expect(r.extra.high).toBeLessThan(0.032);
    expect(r.sharedPercent).toBeCloseTo((r.sharedMb / GENOME_MB) * 100, 10);
  });

  it("the unrelated couple is at background with no added risk to speak of", () => {
    const r = assess(couples["faisal-noura"].declared, couples["faisal-noura"].shared);
    expect(r.band).toBe("background");
    expect(r.consistency).toBe("consistent");
    expect(r.extra.high).toBeLessThan(0.001);
  });
});

describe("escalation", () => {
  it("any Risk Beyond the Panel result routes to a counsellor", () => {
    expect(evaluateEscalation(emptyContext({ riskBeyondPanelResult: true })).map((e) => e.code)).toContain("risk_beyond_panel_result");
    expect(evaluateEscalation(emptyContext({ riskBeyondPanelResult: false })).map((e) => e.code)).not.toContain("risk_beyond_panel_result");
  });
});
