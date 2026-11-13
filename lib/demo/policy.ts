/**
 * Who may reset the demo data. On a public deployment the reset needs the admin passcode set in
 * DEMO_ADMIN_PASSCODE. On a developer machine (no passcode set, not a hosted deployment) it stays
 * one click. A hosted deployment without a passcode has no reset button at all.
 */
import { createHash, timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;

export type ResetPolicy = "open" | "passcode" | "disabled";

const hosted = (env: Env) => env.VERCEL === "1" || !!env.CONTAINER_APP_NAME;

export function resetPolicy(env: Env = process.env): ResetPolicy {
  if (env.DEMO_MODE === "false") return "disabled";
  if (env.DEMO_ADMIN_PASSCODE?.trim()) return "passcode";
  return hosted(env) ? "disabled" : "open";
}

/** Constant time comparison of the supplied passcode with the configured one. */
export function passcodeMatches(supplied: string, env: Env = process.env): boolean {
  const expected = env.DEMO_ADMIN_PASSCODE?.trim();
  if (!expected || typeof supplied !== "string") return false;
  const a = createHash("sha256").update(supplied.trim()).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The nightly job and other scheduled calls must present this secret (Vercel sends it as a Bearer token). */
export function cronAuthorised(authorization: string | null, env: Env = process.env): boolean {
  const secret = env.CRON_SECRET?.trim();
  if (!secret || !authorization) return false;
  const a = createHash("sha256").update(authorization).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}
