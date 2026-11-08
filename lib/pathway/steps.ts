/** Care Pathway Tracker steps (SPEC 4.9), in order. */
export const PATHWAY_STEPS = [
  "result_received",
  "understood",
  "counselling_booked",
  "counselling_completed",
  "confirmatory_testing",
  "specialist_service",
] as const;

export type PathwayStep = (typeof PATHWAY_STEPS)[number];

/** Index of the furthest completed step, or -1. */
export function furthestStep(done: string[]): number {
  let max = -1;
  for (const s of done) max = Math.max(max, PATHWAY_STEPS.indexOf(s as PathwayStep));
  return max;
}
