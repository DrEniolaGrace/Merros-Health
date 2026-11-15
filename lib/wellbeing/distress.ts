/**
 * Distress Check (SPEC 4.12): single item Distress Thermometer, 0 (none) to 10 (extreme).
 * Pure helpers. The escalation threshold lives with the other rules in lib/escalation/rules.ts.
 */
import { DISTRESS_THRESHOLD } from "@/lib/escalation/rules";

export const DISTRESS_MIN = 0;
export const DISTRESS_MAX = 10;
/** From this score, a same week callback is offered prominently and crisis contacts are shown. */
export const DISTRESS_HIGH = 7;

export type DistressBand = "low" | "moderate" | "high";

export function validDistress(score: unknown): score is number {
  return Number.isInteger(score) && (score as number) >= DISTRESS_MIN && (score as number) <= DISTRESS_MAX;
}

export function distressBand(score: number): DistressBand {
  if (!validDistress(score)) throw new Error("Distress score must be a whole number from 0 to 10");
  if (score >= DISTRESS_HIGH) return "high";
  return score >= DISTRESS_THRESHOLD ? "moderate" : "low";
}

/** A callback (counsellor or psychologist) is offered from the escalation threshold upward. */
export function offersCallback(score: number): boolean {
  return distressBand(score) !== "low";
}

export const CALLBACK_KINDS = ["counsellor", "psychologist"] as const;
export type CallbackKind = (typeof CALLBACK_KINDS)[number];
