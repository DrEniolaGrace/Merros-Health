export type AcmgClass = "pathogenic" | "likely_pathogenic" | "vus" | "likely_benign" | "benign";
export type Zygosity = "heterozygous" | "homozygous" | "hemizygous";
export type Inheritance = "AR" | "XL" | "AD";

/** One reported variant, as parsed from a lab signed FHIR result. */
export interface Variant {
  gene: string;
  hgvs: string;
  zygosity: Zygosity;
  acmg: AcmgClass;
  clinvarId: string | null;
  conditionId: string;
}

export function isPathogenicOrLikely(v: Pick<Variant, "acmg">): boolean {
  return v.acmg === "pathogenic" || v.acmg === "likely_pathogenic";
}
