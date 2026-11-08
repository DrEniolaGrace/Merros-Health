/**
 * The single consent gate (SPEC 4.1, 4.13). Pure. Every server path that reads a person's
 * result calls this first. Default is deny.
 */
import type { ConsentPurpose } from "./purposes";

export interface ConsentLike {
  purpose: string;
  recipient: string;
  grantedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export function isConsentActive(c: ConsentLike, now: Date): boolean {
  if (c.revokedAt && c.revokedAt <= now) return false;
  if (c.expiresAt && c.expiresAt <= now) return false;
  return c.grantedAt <= now;
}

export function hasActiveConsent(
  consents: ConsentLike[],
  purpose: ConsentPurpose,
  now: Date = new Date(),
): boolean {
  return consents.some((c) => c.purpose === purpose && isConsentActive(c, now));
}

/** Couple analysis needs BOTH partners to hold an active couple_comparison consent. */
export function coupleConsentsActive(a: ConsentLike[], b: ConsentLike[], now: Date = new Date()): boolean {
  return hasActiveConsent(a, "couple_comparison", now) && hasActiveConsent(b, "couple_comparison", now);
}
