/**
 * Consent purposes offered in Phase 1. Nothing is pre ticked; nothing is shared by default.
 * Each purpose has a fixed recipient and scope so the record says who, what, to whom and why.
 */
export type ConsentPurpose =
  | "view_own_result"
  | "couple_comparison"
  | "counsellor_access"
  | "aggregate_analytics"
  | "reclassification_recontact"
  | "family_doctor_referral"
  | "values_summary_share"
  | "beyond_panel";

export type ConsentRecipient = "self" | "partner" | "counsellor" | "health_system_aggregate" | "family_doctor";

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
  // Offered only when the person links a family doctor in Find Care (one tap consented referral).
  { purpose: "family_doctor_referral", recipient: "family_doctor", scope: "carrier_summary", defaultDays: 90 },
  // Offered inside the Values Compass, never at onboarding.
  { purpose: "values_summary_share", recipient: "counsellor", scope: "values_summary", defaultDays: 90 },
  // Risk Beyond the Panel: separate consent from BOTH partners; the result goes to the counsellor first.
  { purpose: "beyond_panel", recipient: "counsellor", scope: "kinship_estimate", defaultDays: 90 },
];

export const DURATION_CHOICES = [30, 90, 365] as const;

export function purposeDef(p: string): PurposeDef | undefined {
  return PURPOSES.find((d) => d.purpose === p);
}
