/**
 * Escalation Engine (SPEC 4.8). Rule based, auditable, pure, unit tested.
 * Each rule inspects the context and either fires with a reason code or does not.
 * The engine never decides anything clinical; it only routes the person to a human
 * genetic counsellor and records why.
 */
import { inheritanceOf } from "@/lib/risk/genes";
import { type Variant, isPathogenicOrLikely } from "@/lib/risk/types";
import { teachBackFailedTwice, type TeachBackAttemptLite } from "@/lib/teachback/logic";

/** NCCN Distress Thermometer: a score of 4 or more is the commonly used screening cut off. */
export const DISTRESS_THRESHOLD = 4;

export type Severity = "urgent" | "high" | "routine";
const SEVERITY_RANK: Record<Severity, number> = { urgent: 0, high: 1, routine: 2 };

export type EscalationCode =
  | "shared_pathogenic_gene"
  | "vus_present"
  | "significant_personal_finding"
  | "pregnant_or_trying"
  | "high_distress"
  | "teachback_failed_twice"
  | "medical_advice_requested"
  | "safety_verifier_block"
  | "variant_reclassified"
  | "risk_beyond_panel_result";

export const ESCALATION_CODES: EscalationCode[] = [
  "shared_pathogenic_gene",
  "vus_present",
  "significant_personal_finding",
  "pregnant_or_trying",
  "high_distress",
  "teachback_failed_twice",
  "medical_advice_requested",
  "safety_verifier_block",
  "variant_reclassified",
  "risk_beyond_panel_result",
];

export interface EscalationContext {
  /** The person's own reported variants (any classification). */
  ownVariants: Variant[];
  /** Genes both partners carry, from a consented couple analysis. Empty if none or not consented. */
  coupleSharedGenes: string[];
  pregnancyStatus: "none" | "trying" | "pregnant" | "prefer_not_to_say";
  distressScore: number | null;
  teachBackAttempts: TeachBackAttemptLite[];
  medicalAdviceRequested: boolean;
  /** Hooks for later phases (Safety Verifier P2, Living Results P3, Risk Beyond the Panel P5). */
  safetyVerifierBlocked: boolean;
  variantReclassified: boolean;
  riskBeyondPanelResult: boolean;
}

export interface Escalation {
  code: EscalationCode;
  severity: Severity;
  /** Non identifying detail, e.g. gene symbols. */
  detail?: string;
}

type Rule = (ctx: EscalationContext) => Escalation | null;

export const RULES: Record<EscalationCode, Rule> = {
  shared_pathogenic_gene: (c) =>
    c.coupleSharedGenes.length > 0
      ? { code: "shared_pathogenic_gene", severity: "high", detail: [...c.coupleSharedGenes].sort().join(",") }
      : null,

  vus_present: (c) => {
    const genes = [...new Set(c.ownVariants.filter((v) => v.acmg === "vus").map((v) => v.gene))].sort();
    return genes.length ? { code: "vus_present", severity: "routine", detail: genes.join(",") } : null;
  },

  // Severe, X linked or dominant finding: any P/LP variant in a non AR or unknown gene,
  // or a homozygous / multiple P/LP finding in an AR gene (the person may be affected).
  significant_personal_finding: (c) => {
    const pl = c.ownVariants.filter(isPathogenicOrLikely);
    const genes = new Set<string>();
    for (const v of pl) {
      if (inheritanceOf(v.gene) !== "AR") genes.add(v.gene);
      if (v.zygosity !== "heterozygous") genes.add(v.gene);
    }
    const counts = new Map<string, number>();
    for (const v of pl) counts.set(v.gene, (counts.get(v.gene) ?? 0) + 1);
    for (const [g, n] of counts) if (n > 1) genes.add(g);
    return genes.size
      ? { code: "significant_personal_finding", severity: "high", detail: [...genes].sort().join(",") }
      : null;
  },

  pregnant_or_trying: (c) =>
    c.pregnancyStatus === "pregnant"
      ? { code: "pregnant_or_trying", severity: "urgent", detail: "pregnant" }
      : c.pregnancyStatus === "trying"
        ? { code: "pregnant_or_trying", severity: "high", detail: "trying" }
        : null,

  high_distress: (c) =>
    c.distressScore !== null && c.distressScore >= DISTRESS_THRESHOLD
      ? { code: "high_distress", severity: "urgent" }
      : null,

  teachback_failed_twice: (c) =>
    teachBackFailedTwice(c.teachBackAttempts) ? { code: "teachback_failed_twice", severity: "routine" } : null,

  medical_advice_requested: (c) =>
    c.medicalAdviceRequested ? { code: "medical_advice_requested", severity: "routine" } : null,

  safety_verifier_block: (c) =>
    c.safetyVerifierBlocked ? { code: "safety_verifier_block", severity: "routine" } : null,

  variant_reclassified: (c) =>
    c.variantReclassified ? { code: "variant_reclassified", severity: "high" } : null,

  risk_beyond_panel_result: (c) =>
    c.riskBeyondPanelResult ? { code: "risk_beyond_panel_result", severity: "high" } : null,
};

/** Runs every rule; returns all that fire, most severe first (stable by code order within a severity). */
export function evaluateEscalation(ctx: EscalationContext): Escalation[] {
  const fired: Escalation[] = [];
  for (const code of ESCALATION_CODES) {
    const e = RULES[code](ctx);
    if (e) fired.push(e);
  }
  return fired.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export function emptyContext(overrides: Partial<EscalationContext> = {}): EscalationContext {
  return {
    ownVariants: [],
    coupleSharedGenes: [],
    pregnancyStatus: "prefer_not_to_say",
    distressScore: null,
    teachBackAttempts: [],
    medicalAdviceRequested: false,
    safetyVerifierBlocked: false,
    variantReclassified: false,
    riskBeyondPanelResult: false,
    ...overrides,
  };
}
