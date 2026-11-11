/**
 * Family Risk Engine (SPEC 6.4). Deterministic Mendelian carrier probabilities for relatives of a
 * confirmed heterozygous carrier of an autosomal recessive variant. Pure and unit tested.
 *
 * Model
 *  - The carrier inherited the variant from one parent (new mutations are rare and ignored).
 *  - Prel is the chance a relative carries the SAME family variant.
 *  - Population adjustment: P = Prel + (1 - Prel) * f, where f is the population carrier
 *    frequency for the gene (the relative could carry a different variant in the same gene).
 *  - If parental testing shows which side the variant comes from, relatives on that side double
 *    and relatives on the other side fall back to the population frequency.
 *
 * Approximation (documented in CLINICAL_SAFETY.md): when the carrier's own parents are related,
 * the variant could be present on both sides. We then keep the side unknown values for both
 * sides rather than combining paths. Pedigree likelihood software (for example Mendel or
 * PedPro style peeling algorithms) is the production upgrade.
 */
import { type Fraction, ONE, ZERO, frac, toNumber } from "@/lib/risk/fraction";

export const RELATIONS = ["parent", "sibling", "child", "half_sibling", "grandparent", "aunt_uncle", "niece_nephew", "grandchild", "first_cousin"] as const;
export type Relation = (typeof RELATIONS)[number];
export type Side = "maternal" | "paternal" | "unknown" | "na";
export type Tested = "carrier" | "not_carrier" | "unknown";

/** Relations where the mother's or father's side matters. */
export const SIDED: Relation[] = ["parent", "half_sibling", "grandparent", "aunt_uncle", "first_cousin"];

const BASE: Record<Relation, Fraction> = {
  parent: frac(1, 2),
  sibling: frac(1, 2),
  child: frac(1, 2),
  half_sibling: frac(1, 4),
  grandparent: frac(1, 4),
  aunt_uncle: frac(1, 4),
  niece_nephew: frac(1, 4),
  grandchild: frac(1, 4),
  first_cousin: frac(1, 8),
};

/** Chance of carrying the family variant once the side it comes from is known. */
const ON_CARRIER_SIDE: Partial<Record<Relation, Fraction>> = {
  parent: ONE,
  half_sibling: frac(1, 2),
  grandparent: frac(1, 2),
  aunt_uncle: frac(1, 2),
  first_cousin: frac(1, 4),
};

export interface Relative {
  id: string;
  relation: Relation;
  side: Side;
  planning: boolean;
  tested: Tested;
}

export interface RelativeRisk {
  id: string;
  relation: Relation;
  side: Side;
  /** Chance of carrying the same family variant. */
  familyVariant: Fraction;
  /** Chance of being a carrier of any variant in the gene, after population adjustment. */
  probability: number;
  basis: "tested" | "side_known" | "side_unknown";
  /** Ranking score: probability weighted by reproductive relevance. Tested relatives score 0. */
  priority: number;
}

/** Which side the variant comes from, inferred from tested parents. */
export function carrierSide(relatives: Relative[]): "maternal" | "paternal" | "unknown" {
  const parent = (side: Side) => relatives.find((r) => r.relation === "parent" && r.side === side)?.tested ?? "unknown";
  const m = parent("maternal");
  const p = parent("paternal");
  if (m === "carrier" && p !== "carrier") return "maternal";
  if (p === "carrier" && m !== "carrier") return "paternal";
  if (m === "not_carrier" && p === "unknown") return "paternal";
  if (p === "not_carrier" && m === "unknown") return "maternal";
  return "unknown"; // untested, or both carriers
}

export function assess(relatives: Relative[], populationFrequency: number, opts: { parentsRelated?: boolean } = {}): RelativeRisk[] {
  if (!(populationFrequency >= 0 && populationFrequency <= 1)) throw new Error("Population frequency must be between 0 and 1");
  const side = opts.parentsRelated ? "unknown" : carrierSide(relatives);
  return relatives
    .map((r): RelativeRisk => {
      let familyVariant = BASE[r.relation];
      let basis: RelativeRisk["basis"] = "side_unknown";
      if (r.tested === "carrier") {
        return { id: r.id, relation: r.relation, side: r.side, familyVariant: ONE, probability: 1, basis: "tested", priority: 0 };
      }
      if (r.tested === "not_carrier") {
        return { id: r.id, relation: r.relation, side: r.side, familyVariant: ZERO, probability: 0, basis: "tested", priority: 0 };
      }
      if (side !== "unknown" && SIDED.includes(r.relation) && (r.side === "maternal" || r.side === "paternal")) {
        familyVariant = r.side === side ? ON_CARRIER_SIDE[r.relation]! : ZERO;
        basis = "side_known";
      }
      const prel = toNumber(familyVariant);
      const probability = prel + (1 - prel) * populationFrequency;
      return { id: r.id, relation: r.relation, side: r.side, familyVariant, probability, basis, priority: probability * (r.planning ? 1.5 : 1) };
    })
    .sort((a, b) => b.priority - a.priority || b.probability - a.probability);
}

/** Expected number of carriers found if every untested relative were tested (cascade yield). */
export function expectedYield(risks: RelativeRisk[]): number {
  return risks.filter((r) => r.basis !== "tested").reduce((sum, r) => sum + r.probability, 0);
}
