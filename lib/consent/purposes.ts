/**
 * Consent purposes offered in Phase 1. Nothing is pre ticked; nothing is shared by default.
 * Each purpose has a fixed recipient and scope so the record says who, what, to whom and why.
 */
export type ConsentPurpose =
  | "view_own_result"
  | "couple_comparison"
  | "counsellor_access"
  | "aggregate_analytics"
  | "reclassification_recontact";

export type ConsentRecipient = "self" | "partner" | "counsellor" | "health_system_aggregate";

export interface PurposeDef {
  purpose: ConsentPurpose;
  recipient: ConsentRecipient;
  scope: string;
  /** Default validity in days; null means until withdrawn. */
  defaultDays: number | null;
}

export const PURPOSES: PurposeDef[] = [
  { purpose: "view_own_result", recipient: "self", scope: "own_result", defaultDays: null },
  { purpose: "couple_comparison", recipient: "partner", scope: "shared_carrier_genes_only", defaultDays: 90 },
  { purpose: "counsellor_access", recipient: "counsellor", scope: "result_and_journey", defaultDays: 90 },
  { purpose: "aggregate_analytics", recipient: "health_system_aggregate", scope: "anonymous_events", defaultDays: 365 },
  { purpose: "reclassification_recontact", recipient: "counsellor", scope: "variant_updates", defaultDays: 365 },
];

export const DURATION_CHOICES = [30, 90, 365] as const;

export function purposeDef(p: string): PurposeDef | undefined {
  return PURPOSES.find((d) => d.purpose === p);
}
