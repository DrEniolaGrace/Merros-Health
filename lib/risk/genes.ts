import type { Inheritance } from "./types";

/**
 * Genes the prototype knows how to explain. Inheritance drives the risk engine:
 * only autosomal recessive (AR) couple risk is computed automatically; X linked and
 * dominant findings are always routed to a genetic counsellor (SPEC 4.8).
 */
export interface GeneInfo {
  symbol: string;
  inheritance: Inheritance;
  conditionIds: string[];
}

export const GENES: Record<string, GeneInfo> = {
  HBB: { symbol: "HBB", inheritance: "AR", conditionIds: ["beta-thalassaemia", "sickle-cell"] },
  HBA1: { symbol: "HBA1", inheritance: "AR", conditionIds: ["alpha-thalassaemia"] },
  HBA2: { symbol: "HBA2", inheritance: "AR", conditionIds: ["alpha-thalassaemia"] },
  SMN1: { symbol: "SMN1", inheritance: "AR", conditionIds: ["sma"] },
  GJB2: { symbol: "GJB2", inheritance: "AR", conditionIds: ["gjb2-hearing-loss"] },
  CFTR: { symbol: "CFTR", inheritance: "AR", conditionIds: ["cystic-fibrosis"] },
  G6PD: { symbol: "G6PD", inheritance: "XL", conditionIds: ["g6pd-deficiency"] },
};

/** Unknown genes are treated conservatively: never auto computed, always escalated. */
export function inheritanceOf(gene: string): Inheritance | "unknown" {
  return GENES[gene]?.inheritance ?? "unknown";
}
