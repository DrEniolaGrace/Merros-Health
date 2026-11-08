/**
 * Meros deterministic risk engine (SPEC 4.3). Pure functions, no I/O, fully unit tested.
 * Language models never compute these numbers; they may only call this code.
 *
 * Model: autosomal recessive (AR) Mendelian transmission. For each parent and gene, t is the
 * probability that the parent passes on a pathogenic allele:
 *   no P/LP variant -> 0, one heterozygous P/LP -> 1/2, homozygous P/LP -> 1.
 * Per pregnancy (independent each time):
 *   affected = tA * tB, carrier = tA(1 - tB) + tB(1 - tA), non carrier = (1 - tA)(1 - tB)
 * Two carriers gives the classic 25% / 50% / 25%.
 *
 * Multi gene: P(affected by at least one condition) = 1 - product(1 - affected_i).
 *
 * Deliberately NOT computed (returned as needs_counsellor):
 *  - X linked, dominant, or unknown genes
 *  - two different P/LP variants in one gene in one person (phase unknown)
 *  - hemizygous calls in an AR gene (inconsistent data)
 * VUS and benign variants never contribute to numbers; VUS are surfaced as uncertainties.
 */
import { inheritanceOf } from "./genes";
import { type Fraction, frac, mul, sub, add, ONE, ZERO, HALF } from "./fraction";
import { type Variant, isPathogenicOrLikely } from "./types";

export type CarrierStatus =
  | { kind: "not_carrier" }
  | { kind: "carrier"; variants: Variant[] }
  | { kind: "needs_counsellor"; reason: NeedsCounsellorReason; variants: Variant[] };

export type NeedsCounsellorReason =
  | "x_linked"
  | "dominant"
  | "unknown_gene"
  | "two_variants_phase_unknown"
  | "homozygous_finding"
  | "inconsistent_zygosity";

export interface PersonGeneSummary {
  gene: string;
  status: CarrierStatus;
}

export interface PersonSummary {
  genes: PersonGeneSummary[];
  vus: Variant[];
}

/** Summarise one person's own result (shown before any couple analysis). */
export function summarisePerson(variants: Variant[]): PersonSummary {
  const byGene = groupPathogenicByGene(variants);
  const genes: PersonGeneSummary[] = [];
  for (const [gene, vs] of byGene) {
    genes.push({ gene, status: personGeneStatus(gene, vs) });
  }
  genes.sort((a, b) => a.gene.localeCompare(b.gene));
  return { genes, vus: variants.filter((v) => v.acmg === "vus") };
}

function personGeneStatus(gene: string, vs: Variant[]): CarrierStatus {
  const inh = inheritanceOf(gene);
  if (inh === "XL") return { kind: "needs_counsellor", reason: "x_linked", variants: vs };
  if (inh === "AD") return { kind: "needs_counsellor", reason: "dominant", variants: vs };
  if (inh === "unknown") return { kind: "needs_counsellor", reason: "unknown_gene", variants: vs };
  const t = transmission(vs);
  if (t.kind === "needs_counsellor") return { kind: "needs_counsellor", reason: t.reason, variants: vs };
  if (vs.some((v) => v.zygosity === "homozygous")) {
    return { kind: "needs_counsellor", reason: "homozygous_finding", variants: vs };
  }
  return { kind: "carrier", variants: vs };
}

type Transmission = { kind: "ok"; t: Fraction } | { kind: "needs_counsellor"; reason: NeedsCounsellorReason };

/** Probability a parent transmits a pathogenic allele in an AR gene, from their P/LP variants. */
export function transmission(pathogenicVariantsInGene: Variant[]): Transmission {
  const vs = pathogenicVariantsInGene;
  if (vs.length === 0) return { kind: "ok", t: ZERO };
  if (vs.some((v) => v.zygosity === "hemizygous")) {
    return { kind: "needs_counsellor", reason: "inconsistent_zygosity" };
  }
  if (vs.length === 1) {
    return { kind: "ok", t: vs[0].zygosity === "homozygous" ? ONE : HALF };
  }
  const distinct = new Set(vs.map((v) => v.hgvs));
  if (distinct.size === 1 && vs.every((v) => v.zygosity === "homozygous")) {
    return { kind: "ok", t: ONE };
  }
  return { kind: "needs_counsellor", reason: "two_variants_phase_unknown" };
}

export interface PregnancyOutcome {
  affected: Fraction;
  carrier: Fraction;
  nonCarrier: Fraction;
}

export function perPregnancy(tA: Fraction, tB: Fraction): PregnancyOutcome {
  const notA = sub(ONE, tA);
  const notB = sub(ONE, tB);
  return {
    affected: mul(tA, tB),
    carrier: add(mul(tA, notB), mul(tB, notA)),
    nonCarrier: mul(notA, notB),
  };
}

export type CoupleGeneResult =
  | {
      gene: string;
      kind: "computed";
      shared: boolean; // both partners carry a P/LP variant in this gene
      outcome: PregnancyOutcome;
      conditionIds: string[];
    }
  | { gene: string; kind: "needs_counsellor"; reason: NeedsCounsellorReason; conditionIds: string[] };

export interface CoupleResult {
  genes: CoupleGeneResult[];
  /** Genes where both partners carry a P/LP variant (and the gene is computable). */
  sharedGenes: string[];
  /** P(pregnancy affected by at least one computed condition). */
  combinedAffected: Fraction;
  /** VUS from either partner; never part of the numbers. */
  vusCount: number;
  needsCounsellor: boolean;
}

/**
 * Couple analysis over every gene in which at least one partner has a P/LP variant.
 * Per gene and combined, per pregnancy.
 */
export function analyseCouple(partnerA: Variant[], partnerB: Variant[]): CoupleResult {
  const a = groupPathogenicByGene(partnerA);
  const b = groupPathogenicByGene(partnerB);
  const genes = [...new Set([...a.keys(), ...b.keys()])].sort();
  const results: CoupleGeneResult[] = [];

  for (const gene of genes) {
    const va = a.get(gene) ?? [];
    const vb = b.get(gene) ?? [];
    const conditionIds = [...new Set([...va, ...vb].map((v) => v.conditionId))].sort();
    const inh = inheritanceOf(gene);
    if (inh !== "AR") {
      const reason: NeedsCounsellorReason =
        inh === "XL" ? "x_linked" : inh === "AD" ? "dominant" : "unknown_gene";
      results.push({ gene, kind: "needs_counsellor", reason, conditionIds });
      continue;
    }
    const ta = transmission(va);
    const tb = transmission(vb);
    if (ta.kind === "needs_counsellor" || tb.kind === "needs_counsellor") {
      const reason = ta.kind === "needs_counsellor" ? ta.reason : (tb as { reason: NeedsCounsellorReason }).reason;
      results.push({ gene, kind: "needs_counsellor", reason, conditionIds });
      continue;
    }
    results.push({
      gene,
      kind: "computed",
      shared: va.length > 0 && vb.length > 0,
      outcome: perPregnancy(ta.t, tb.t),
      conditionIds,
    });
  }

  const computed = results.filter((r): r is Extract<CoupleGeneResult, { kind: "computed" }> => r.kind === "computed");
  return {
    genes: results,
    sharedGenes: computed.filter((r) => r.shared).map((r) => r.gene),
    combinedAffected: combineAffected(computed.map((r) => r.outcome.affected)),
    vusCount: [...partnerA, ...partnerB].filter((v) => v.acmg === "vus").length,
    needsCounsellor: results.some((r) => r.kind === "needs_counsellor"),
  };
}

/** 1 - product(1 - p_i). Empty input gives 0. */
export function combineAffected(perGene: Fraction[]): Fraction {
  let none = ONE;
  for (const p of perGene) {
    if (p.num < 0 || p.num > p.den) throw new Error("Probability out of range");
    none = mul(none, sub(ONE, p));
  }
  return sub(ONE, none);
}

function groupPathogenicByGene(variants: Variant[]): Map<string, Variant[]> {
  const map = new Map<string, Variant[]>();
  for (const v of variants) {
    if (!isPathogenicOrLikely(v)) continue;
    const list = map.get(v.gene) ?? [];
    list.push(v);
    map.set(v.gene, list);
  }
  return map;
}

export { frac };
