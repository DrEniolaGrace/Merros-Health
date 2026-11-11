import { describe, expect, it } from "vitest";
import { RELATIONS, assess, carrierSide, expectedYield, type Relative } from "@/lib/family/engine";
import { frac } from "@/lib/risk/fraction";
import { frequencyFor } from "@/lib/family/frequencies";

const rel = (relation: Relative["relation"], side: Relative["side"] = "unknown", extra: Partial<Relative> = {}): Relative => ({
  id: `${relation}-${side}-${Math.random()}`, relation, side, planning: false, tested: "unknown", ...extra,
});
const one = (r: Relative, f = 0, others: Relative[] = []) => assess([r, ...others], f).find((x) => x.id === r.id)!;

describe("Mendelian carrier probabilities (side unknown, f = 0)", () => {
  it.each([
    ["parent", 1, 2],
    ["sibling", 1, 2],
    ["child", 1, 2],
    ["half_sibling", 1, 4],
    ["grandparent", 1, 4],
    ["aunt_uncle", 1, 4],
    ["niece_nephew", 1, 4],
    ["grandchild", 1, 4],
    ["first_cousin", 1, 8],
  ] as const)("%s: %i/%i", (relation, n, d) => {
    const r = one(rel(relation));
    expect(r.familyVariant).toEqual(frac(n, d));
    expect(r.probability).toBeCloseTo(n / d, 12);
    expect(r.basis).toBe("side_unknown");
  });
  it("covers every relation", () => expect(RELATIONS).toHaveLength(9));
});

describe("population adjustment: P = Prel + (1 - Prel) * f", () => {
  it("first cousin with f = 8.5%: 1/8 + 7/8 * 0.085", () => {
    expect(one(rel("first_cousin"), 0.085).probability).toBeCloseTo(0.125 + 0.875 * 0.085, 12);
  });
  it("sibling with f = 2%: 0.5 + 0.5 * 0.02", () => expect(one(rel("sibling"), 0.02).probability).toBeCloseTo(0.51, 12));
  it("never exceeds 1 and never falls below f", () => {
    for (const relation of RELATIONS) {
      const p = one(rel(relation), 0.3).probability;
      expect(p).toBeGreaterThanOrEqual(0.3);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
  it("rejects impossible frequencies", () => {
    expect(() => assess([rel("sibling")], -0.1)).toThrow();
    expect(() => assess([rel("sibling")], 1.5)).toThrow();
  });
});

describe("side known from parental testing", () => {
  const mother = rel("parent", "maternal", { tested: "carrier" });
  const father = rel("parent", "paternal");
  it("infers the side", () => {
    expect(carrierSide([mother, father])).toBe("maternal");
    expect(carrierSide([rel("parent", "maternal", { tested: "not_carrier" }), father])).toBe("paternal");
    expect(carrierSide([rel("parent", "maternal"), father])).toBe("unknown");
    expect(carrierSide([mother, rel("parent", "paternal", { tested: "carrier" })])).toBe("unknown");
  });
  it("maternal relatives double, paternal relatives fall to the population frequency", () => {
    const f = 0.085;
    expect(one(rel("aunt_uncle", "maternal"), f, [mother]).probability).toBeCloseTo(0.5 + 0.5 * f, 12);
    expect(one(rel("first_cousin", "maternal"), f, [mother]).probability).toBeCloseTo(0.25 + 0.75 * f, 12);
    expect(one(rel("grandparent", "maternal"), f, [mother]).probability).toBeCloseTo(0.5 + 0.5 * f, 12);
    expect(one(rel("aunt_uncle", "paternal"), f, [mother]).probability).toBeCloseTo(f, 12);
    expect(one(rel("first_cousin", "paternal"), f, [mother]).probability).toBeCloseTo(f, 12);
    expect(one(father, f, [mother]).probability).toBeCloseTo(f, 12);
  });
  it("siblings and children do not depend on the side", () => {
    expect(one(rel("sibling"), 0, [mother]).probability).toBe(0.5);
    expect(one(rel("child", "na"), 0, [mother]).probability).toBe(0.5);
  });
  it("a relative whose side was not given keeps the side unknown value", () => {
    expect(one(rel("aunt_uncle", "unknown"), 0, [mother]).probability).toBe(0.25);
  });
  it("when the carrier's parents are related, sides are not narrowed (documented approximation)", () => {
    const r = assess([mother, rel("aunt_uncle", "paternal")], 0, { parentsRelated: true }).find((x) => x.relation === "aunt_uncle")!;
    expect(r.probability).toBe(0.25);
    expect(r.basis).toBe("side_unknown");
  });
});

describe("tested relatives and ranking", () => {
  it("tested relatives are certain and never ranked for testing", () => {
    const [c, n] = [one(rel("sibling", "na", { tested: "carrier" }), 0.1), one(rel("sibling", "na", { tested: "not_carrier" }), 0.1)];
    expect([c.probability, c.priority, c.basis]).toEqual([1, 0, "tested"]);
    expect([n.probability, n.priority]).toEqual([0, 0]);
  });
  it("ranks by probability, with adults planning marriage or pregnancy first among equals", () => {
    const sib = rel("sibling");
    const sibPlanning = rel("sibling", "unknown", { planning: true });
    const cousinPlanning = rel("first_cousin", "unknown", { planning: true });
    const order = assess([cousinPlanning, sib, sibPlanning], 0).map((r) => r.id);
    expect(order).toEqual([sibPlanning.id, sib.id, cousinPlanning.id]);
  });
  it("expected cascade yield sums untested relatives only", () => {
    const risks = assess([rel("sibling"), rel("sibling"), rel("first_cousin"), rel("parent", "maternal", { tested: "carrier" })], 0);
    expect(expectedYield(risks)).toBeCloseTo(0.5 + 0.5 + 0.125, 12);
  });
});

describe("carrier frequencies are flagged as illustrative", () => {
  it("every value says so, and unknown genes get a default", () => {
    expect(frequencyFor("HBB").population).toContain("illustrative");
    expect(frequencyFor("ZZZ").f).toBe(0.02);
  });
});
