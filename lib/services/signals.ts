import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { hasActiveConsent } from "@/lib/consent/check";
import type { EventKind } from "@/lib/signals/events";

/**
 * Keyed hash of the user id. It lets one person's contributions be bounded (needed for
 * differential privacy) and deleted on request, without storing the user id in the aggregate store.
 */
export function journeyFor(userId: string): string {
  return "live-" + createHmac("sha256", Buffer.from(env().ENCRYPTION_MASTER_KEY, "base64")).update(`signals:${userId}`).digest("hex").slice(0, 32);
}

/** Demo personas have no home region on file; live events are attributed to Abu Dhabi. */
const DEFAULT_REGION = "abu_dhabi";

/**
 * Streams one anonymous event into the aggregate store, only if the person agreed to anonymous
 * statistics. Never throws: analytics must not break a care journey.
 */
export async function recordSignal(userId: string, kind: EventKind, value: number | null = null) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true, consents: true } });
    if (!user || user.role !== "patient" || !hasActiveConsent(user.consents, "aggregate_analytics")) return;
    await prisma.aggregateEvent.create({
      data: { journey: journeyFor(userId), kind, region: DEFAULT_REGION, language: user.profile?.locale ?? "ar", readingLevel: user.profile?.readingLevel ?? "standard", value },
    });
  } catch (e) {
    console.error("recordSignal failed", e);
  }
}

/** Removes a person's anonymous events (used by "Delete my data"). */
export async function forgetSignals(userId: string) {
  await prisma.aggregateEvent.deleteMany({ where: { journey: journeyFor(userId) } });
}
