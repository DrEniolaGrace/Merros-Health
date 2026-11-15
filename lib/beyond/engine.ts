/**
 * Risk Beyond the Panel (SPEC 6.2): residual recessive risk that a gene panel cannot see, estimated
 * from how much DNA a couple shares by descent. Pure, deterministic and unit tested. No AI model
 * and no network. Every number shown to a counsellor or a couple comes from this file.
 *
 * Method, in plain terms:
 *   1. Segments the partners share identical by descent (IBD) are measured across the autosomes.
 *   2. Kinship coefficient = (share of the genome that is IBD on one copy) / 4.
 *   3. A child's inbreeding coefficient F equals the parents' kinship coefficient. F is also the
 *      share of the child's genome expected to be identical on both copies (autozygous).
 *   4. The extra chance of a significant childhood condition is scaled from the published range
 *      for first cousins (1.7 to 2.8 percentage points above the general population; Bennett et
 *      al. 2002, Journal of Genetic Counseling 11:97) in proportion to F.
 *
 * This is a population level estimate with wide uncertainty. It is never a diagnosis.
 */

/** GRCh38 autosome lengths in megabases (rounded). */
export const AUTOSOME_MB: Record<number, number> = {
  1: 248, 2: 242, 3: 198, 4: 190, 5: 182, 6: 171, 7: 159, 8: 145, 9: 138, 10: 134, 11: 135,
  12: 133, 13: 114, 14: 107, 15: 102, 16: 90, 17: 83, 18: 80, 19: 59, 20: 64, 21: 47, 22: 51,
};
export const GENOME_MB = Object.values(AUTOSOME_MB).reduce((a, b) => a + b, 0);

export interface Segment {
  chr: number;
  startMb: number;
  endMb: number;
}

export const RELATIONSHIPS = ["unrelated", "second_cousins", "first_cousins_once_removed", "first_cousins", "double_first_cousins"] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

/** Expected kinship coefficient from the family tree alone. */
export const PEDIGREE_KINSHIP: Record<Relationship, number> = {
  unrelated: 0,
  second_cousins: 1 / 64,
  first_cousins_once_removed: 1 / 32,
  first_cousins: 1 / 16,
  double_first_cousins: 1 / 8,
};

/** Segments must sit inside their chromosome and not overlap each other. */
export function validateSegments(segments: Segment[]): void {
  const byChr = new Map<number, Segment[]>();
  for (const s of segments) {
    const len = AUTOSOME_MB[s.chr];
    if (!len) throw new Error(`Unknown autosome ${s.chr}`);
    if (!(s.startMb >= 0) || !(s.endMb > s.startMb) || s.endMb > len) throw new Error(`Segment outside chromosome ${s.chr}`);
    byChr.set(s.chr, [...(byChr.get(s.chr) ?? []), s]);
  }
  for (const list of byChr.values()) {
    const sorted = [...list].sort((a, b) => a.startMb - b.startMb);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].startMb < sorted[i - 1].endMb) throw new Error("Overlapping segments");
  }
}

export function totalMb(segments: Segment[]): number {
  return segments.reduce((n, s) => n + (s.endMb - s.startMb), 0);
}

/** Kinship coefficient from segments shared on one copy (IBD1). */
export function kinshipFromShared(segments: Segment[]): number {
  validateSegments(segments);
  return totalMb(segments) / GENOME_MB / 4;
}

/** A child's inbreeding coefficient equals the parents' kinship coefficient. */
export const childInbreeding = (kinship: number) => kinship;

/** Share of one person's genome in runs of homozygosity (FROH). */
export function froh(segments: Segment[]): number {
  validateSegments(segments);
  return totalMb(segments) / GENOME_MB;
}

/** Published extra risk for children of first cousins, above the general population (Bennett 2002). */
export const FIRST_COUSIN_EXTRA = { low: 0.017, high: 0.028 } as const;
/** Estimates are not extended beyond twice the first cousin level; above that a counsellor must assess individually. */
export const MAX_SCALE = 2;

export interface ExtraRisk {
  low: number;
  high: number;
  /** True when the couple shares more than the range the published figures cover. */
  beyondRange: boolean;
}

/** Extra chance of a significant childhood condition, scaled in proportion to F. */
export function extraRisk(f: number): ExtraRisk {
  if (!(f >= 0) || f > 0.5) throw new Error("Inbreeding coefficient out of range");
  const scale = f / PEDIGREE_KINSHIP.first_cousins;
  const capped = Math.min(scale, MAX_SCALE);
  return { low: FIRST_COUSIN_EXTRA.low * capped, high: FIRST_COUSIN_EXTRA.high * capped, beyondRange: scale > MAX_SCALE };
}

export type Band = "background" | "slightly_above" | "moderately_above" | "individual_assessment";

/** Plain language band. Thresholds sit between the pedigree values so each relationship lands clearly. */
export function band(f: number): Band {
  if (f > PEDIGREE_KINSHIP.first_cousins * MAX_SCALE) return "individual_assessment";
  if (f >= 3 / 64) return "moderately_above"; // first cousins (1/16) and closer
  if (f >= 1 / 128) return "slightly_above"; // second cousins (1/64) to first cousins once removed (1/32)
  return "background";
}

export type Consistency = "consistent" | "more_than_declared" | "less_than_declared";

/**
 * Compares the measured kinship with what the declared relationship predicts. A clear mismatch can
 * reveal relatedness a couple did not know about, which is why this goes to the counsellor first.
 * Real sharing varies around the expectation, so only a difference of more than half the expected
 * value (and at least 1/128) counts.
 */
export function consistency(declared: Relationship, measured: number): Consistency {
  const expected = PEDIGREE_KINSHIP[declared];
  const tolerance = Math.max(expected / 2, 1 / 128);
  if (measured > expected + tolerance) return "more_than_declared";
  if (measured < expected - tolerance) return "less_than_declared";
  return "consistent";
}

export interface BeyondPanelResult {
  declared: Relationship;
  sharedMb: number;
  sharedPercent: number;
  kinship: number;
  expectedKinship: number;
  childF: number;
  band: Band;
  extra: ExtraRisk;
  consistency: Consistency;
  segments: Segment[];
}

export function assess(declared: Relationship, shared: Segment[]): BeyondPanelResult {
  const kinship = kinshipFromShared(shared);
  const f = childInbreeding(kinship);
  return {
    declared,
    sharedMb: totalMb(shared),
    sharedPercent: (totalMb(shared) / GENOME_MB) * 100,
    kinship,
    expectedKinship: PEDIGREE_KINSHIP[declared],
    childF: f,
    band: band(f),
    extra: extraRisk(f),
    consistency: consistency(declared, kinship),
    segments: shared,
  };
}
