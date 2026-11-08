import { describe, expect, it } from "vitest";
import { analyseCouple, combineAffected, perPregnancy, summarisePerson, transmission } from "@/lib/risk/engine";
import { frac, eq, toPercentString, HALF, ONE, ZERO, toNumber } from "@/lib/risk/fraction";
import type { AcmgClass, Variant, Zygosity } from "@/lib/risk/types";
import { persona } from "@/content/personas";

const v = (gene: string, acmg: AcmgClass = "pathogenic", zygosity: Zygosity = "heterozygous", hgvs = `${gene}:c.1A>G`): Variant => ({
  gene, hgvs, zygosity, acmg, clinvarId: null, conditionId: "x",
});

describe("fractions", () => {
  it("reduces and formats exactly", () => {
    expect(frac(2, 8)).toEqual({ num: 1, den: 4 });
    expect(toPercentString(frac(7, 16))).toBe("43.75");
    expect(toPercentString(frac(1, 4))).toBe("25");
  });
  it("rejects invalid fractions", () => {
    expect(() => frac(1, 0)).toThrow();
    expect(() => frac(0.5, 2)).toThrow();
  });
});

describe("transmission", () => {
  it("no variant transmits nothing", () => expect(transmission([])).toEqual({ kind: "ok", t: ZERO }));
  it("heterozygous transmits half", () => expect(transmission([v("HBB")])).toEqual({ kind: "ok", t: HALF }));
  it("homozygous transmits always", () => expect(transmission([v("HBB", "pathogenic", "homozygous")])).toEqual({ kind: "ok", t: ONE }));
  it("two different variants in one gene is not auto computed (phase unknown)", () => {
    const r = transmission([v("HBB", "pathogenic", "heterozygous", "a"), v("HBB", "pathogenic", "heterozygous", "b")]);
    expect(r).toEqual({ kind: "needs_counsellor", reason: "two_variants_phase_unknown" });
  });
  it("hemizygous in an AR gene is flagged as inconsistent", () => {
    expect(transmission([v("HBB", "pathogenic", "hemizygous")]).kind).toBe("needs_counsellor");
  });
});

describe("per pregnancy outcome", () => {
  it("two carriers: 25% affected, 50% carrier, 25% non carrier", () => {
    const o = perPregnancy(HALF, HALF);
    expect(o.affected).toEqual(frac(1, 4));
    expect(o.carrier).toEqual(frac(1, 2));
    expect(o.nonCarrier).toEqual(frac(1, 4));
  });
  it("one carrier: 0% affected, 50% carrier", () => {
    const o = perPregnancy(HALF, ZERO);
    expect(o.affected).toEqual(ZERO);
    expect(o.carrier).toEqual(HALF);
    expect(o.nonCarrier).toEqual(HALF);
  });
  it("outcomes always sum to 1", () => {
    for (const a of [ZERO, HALF, ONE]) for (const b of [ZERO, HALF, ONE]) {
      const o = perPregnancy(a, b);
      expect(toNumber(o.affected) + toNumber(o.carrier) + toNumber(o.nonCarrier)).toBeCloseTo(1, 12);
    }
  });
});

describe("couple analysis", () => {
  it("both pathogenic carriers in the same gene", () => {
    const r = analyseCouple([v("HBB")], [v("HBB")]);
    expect(r.sharedGenes).toEqual(["HBB"]);
    expect(r.combinedAffected).toEqual(frac(1, 4));
  });
  it("likely pathogenic counts the same as pathogenic", () => {
    const r = analyseCouple([v("HBB", "likely_pathogenic")], [v("HBB")]);
    expect(r.sharedGenes).toEqual(["HBB"]);
  });
  it("VUS never contributes to numbers but is counted", () => {
    const r = analyseCouple([v("HBB", "vus")], [v("HBB")]);
    expect(r.sharedGenes).toEqual([]);
    expect(r.combinedAffected).toEqual(ZERO);
    expect(r.vusCount).toBe(1);
  });
  it("benign and likely benign are ignored", () => {
    const r = analyseCouple([v("HBB", "benign")], [v("HBB", "likely_benign")]);
    expect(r.genes).toEqual([]);
    expect(r.combinedAffected).toEqual(ZERO);
  });
  it("carriers of different genes have no shared risk", () => {
    const r = analyseCouple([v("HBB")], [v("SMN1")]);
    expect(r.sharedGenes).toEqual([]);
    expect(r.combinedAffected).toEqual(ZERO);
    expect(r.genes.every((g) => g.kind === "computed" && eq(g.outcome.affected, ZERO))).toBe(true);
  });
  it("two shared genes: 1 - (3/4)^2 = 7/16 = 43.75%", () => {
    const r = analyseCouple([v("HBB"), v("GJB2")], [v("HBB"), v("GJB2")]);
    expect(r.sharedGenes).toEqual(["GJB2", "HBB"]);
    expect(r.combinedAffected).toEqual(frac(7, 16));
    expect(toPercentString(r.combinedAffected)).toBe("43.75");
  });
  it("three shared genes: 1 - (3/4)^3 = 37/64", () => {
    const r = analyseCouple([v("HBB"), v("GJB2"), v("CFTR")], [v("HBB"), v("GJB2"), v("CFTR")]);
    expect(r.combinedAffected).toEqual(frac(37, 64));
  });
  it("empty results give zero risk", () => {
    const r = analyseCouple([], []);
    expect(r.genes).toEqual([]);
    expect(r.combinedAffected).toEqual(ZERO);
  });
  it("X linked genes are never auto computed", () => {
    const r = analyseCouple([v("G6PD", "pathogenic", "hemizygous")], [v("HBB")]);
    const g6pd = r.genes.find((g) => g.gene === "G6PD");
    expect(g6pd).toMatchObject({ kind: "needs_counsellor", reason: "x_linked" });
    expect(r.needsCounsellor).toBe(true);
  });
  it("unknown genes are never auto computed", () => {
    const r = analyseCouple([v("ZZZ1")], [v("ZZZ1")]);
    expect(r.genes[0]).toMatchObject({ kind: "needs_counsellor", reason: "unknown_gene" });
    expect(r.combinedAffected).toEqual(ZERO);
  });
  it("is symmetric between partners", () => {
    const a = [v("HBB"), v("GJB2")];
    const b = [v("HBB")];
    expect(analyseCouple(a, b).combinedAffected).toEqual(analyseCouple(b, a).combinedAffected);
  });
});

describe("combineAffected properties", () => {
  const ps = [frac(0), frac(1, 4), frac(1, 2), frac(1, 16), frac(1)];
  it("stays within [0,1] and never decreases when genes are added", () => {
    let acc: ReturnType<typeof frac>[] = [];
    let prev = 0;
    for (const p of [...ps, ...ps]) {
      acc = [...acc, p];
      const c = toNumber(combineAffected(acc));
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
  });
  it("rejects probabilities outside [0,1]", () => {
    expect(() => combineAffected([{ num: 5, den: 4 }])).toThrow();
  });
});

describe("person summary", () => {
  it("carrier of an AR gene", () => {
    const s = summarisePerson([v("HBB")]);
    expect(s.genes).toEqual([{ gene: "HBB", status: { kind: "carrier", variants: [v("HBB")] } }]);
  });
  it("homozygous P/LP in AR gene routes to counsellor", () => {
    const s = summarisePerson([v("HBB", "pathogenic", "homozygous")]);
    expect(s.genes[0].status).toMatchObject({ kind: "needs_counsellor", reason: "homozygous_finding" });
  });
  it("collects VUS separately", () => {
    const s = summarisePerson([v("HBB", "vus")]);
    expect(s.genes).toEqual([]);
    expect(s.vus).toHaveLength(1);
  });
});

describe("demo personas", () => {
  it("Mariam and Khalid share HBB and GJB2: 25% each, 43.75% combined", () => {
    const r = analyseCouple(persona("mariam").variants!, persona("khalid").variants!);
    expect(r.sharedGenes).toEqual(["GJB2", "HBB"]);
    for (const g of r.genes) {
      expect(g.kind).toBe("computed");
      if (g.kind === "computed") expect(g.outcome.affected).toEqual(frac(1, 4));
    }
    expect(toPercentString(r.combinedAffected)).toBe("43.75");
  });
  it("Noura and Faisal: no shared gene, 0% from the panel, 50% carrier chance for SMN1", () => {
    const r = analyseCouple(persona("noura").variants!, persona("faisal").variants!);
    expect(r.sharedGenes).toEqual([]);
    expect(r.combinedAffected).toEqual(ZERO);
    const smn1 = r.genes.find((g) => g.gene === "SMN1");
    expect(smn1 && smn1.kind === "computed" && smn1.outcome.carrier).toEqual(HALF);
  });
});
