/**
 * Care Pathway Tracker (SPEC 4.9), aligned with the Abu Dhabi premarital screening process
 * (DoH Premarital Screening Standard, DoH/STD/PSS/V3, section 3.3 and Appendices 14 and 15):
 * screening visit, results, confirmatory haemoglobin testing where needed, results counselling,
 * the Premarital Screening and Counselling Report, and referral where needed. "Understood" is
 * Merros's own Teach Back step. Stored step names never change, so past records stay valid.
 */
export const PATHWAY_STEPS = [
  "screening_visit",
  "result_received",
  "confirmatory_testing",
  "understood",
  "counselling_booked",
  "counselling_completed",
  "report_issued",
  "specialist_service",
] as const;

export type PathwayStep = (typeof PATHWAY_STEPS)[number];

/** Steps that only happen for some people. They are never shown as "you are here". */
export const OPTIONAL_STEPS: readonly PathwayStep[] = ["confirmatory_testing", "specialist_service"];

/** Index of the furthest completed step, or -1. */
export function furthestStep(done: string[]): number {
  let max = -1;
  for (const s of done) max = Math.max(max, PATHWAY_STEPS.indexOf(s as PathwayStep));
  return max;
}

/** Index of the step the person is on: the first required step after the furthest one done, or -1 when none is left. */
export function currentStep(done: string[]): number {
  const from = furthestStep(done) + 1;
  for (let i = from; i < PATHWAY_STEPS.length; i++) if (!OPTIONAL_STEPS.includes(PATHWAY_STEPS[i])) return i;
  return -1;
}
