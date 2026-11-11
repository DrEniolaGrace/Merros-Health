"use server";

/**
 * Blind Couple Match relay (SPEC 6.1). These actions only accept and hand back opaque, blinded
 * ristretto255 points. No secret scalar, gene name or intersection ever reaches the server.
 */
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { purposeDef } from "@/lib/consent/purposes";
import { isValidPointSet, psiItemsFromSignedResult } from "@/lib/psi/protocol";
import { getCoupleStatus, getOwnSignedResult } from "@/lib/services/results";
import { redirect } from "@/i18n/navigation";

const DAY = 86_400_000;

export interface PsiState {
  selfConsented: boolean;
  /** My own round 1 as stored by the relay (lets the device detect a stale local secret). */
  myRound1: string[] | null;
  myRound2Done: boolean;
  /** Released only while BOTH Dual Key consents are active. */
  partnerRound1: string[] | null;
  /** The partner's exponentiation of my round 1, in my order. */
  partnerRound2: string[] | null;
}

async function context() {
  const user = await requireUser(["patient"]);
  const couple = await getCoupleStatus(user);
  if (couple.status !== "linked") throw new Error("No partner linked");
  return { user, couple };
}

const asSet = (v: Prisma.JsonValue | null | undefined) => (Array.isArray(v) ? (v as string[]) : null);

export async function psiState(): Promise<PsiState> {
  const { couple } = await context();
  const s = await prisma.psiSession.findUnique({ where: { coupleLinkId: couple.linkId } });
  const mine = couple.role === "a" ? { r1: s?.aRound1, r2: s?.aRound2 } : { r1: s?.bRound1, r2: s?.bRound2 };
  const theirs = couple.role === "a" ? { r1: s?.bRound1, r2: s?.bRound2 } : { r1: s?.aRound1, r2: s?.aRound2 };
  const release = couple.bothConsented;
  return {
    selfConsented: couple.selfConsented,
    myRound1: couple.selfConsented ? asSet(mine.r1) : null,
    myRound2Done: !!asSet(mine.r2),
    partnerRound1: release ? asSet(theirs.r1) : null,
    partnerRound2: release ? asSet(theirs.r2) : null,
  };
}

/**
 * Dual Key, this partner's turn: records their own consent (if not already active) and returns
 * THEIR OWN signed result to their own device, with the lab public key to verify it there.
 */
export async function psiTurnKey(): Promise<{ bundle: unknown; signature: string; labPublicKey: string }> {
  const { user, couple } = await context();
  const signed = await getOwnSignedResult(user);
  if (!signed) throw new Error("A verified result is required");
  if (!couple.selfConsented) {
    const def = purposeDef("couple_comparison")!;
    await prisma.consent.create({
      data: { userId: user.id, purpose: def.purpose, scope: def.scope, recipient: def.recipient, expiresAt: new Date(Date.now() + (def.defaultDays ?? 90) * DAY) },
    });
    await appendAudit({ actorId: user.id, subjectId: user.id, action: "consent_granted", resource: "consent:couple_comparison" });
  }
  return { ...signed, labPublicKey: env().LAB_SIGNING_PUBLIC_KEY };
}

export async function psiSubmitRound1(points: string[]) {
  const { user, couple } = await context();
  if (!couple.selfConsented) throw new Error("Consent required");
  // Server side input integrity: a lab signed result must be on file (signature re verified),
  // and the submission must be exactly one fixed size set of valid points.
  const signed = await getOwnSignedResult(user);
  if (!signed) throw new Error("A verified result is required");
  psiItemsFromSignedResult(signed.bundle, signed.signature, env().LAB_SIGNING_PUBLIC_KEY);
  if (!isValidPointSet(points)) throw new Error("Invalid point set");
  const mine = couple.role === "a" ? { aRound1: points } : { bRound1: points };
  // A new round 1 means a new secret: any earlier round 2 values are void.
  await prisma.psiSession.upsert({
    where: { coupleLinkId: couple.linkId },
    create: { coupleLinkId: couple.linkId, ...mine },
    update: { ...mine, aRound2: null as unknown as Prisma.InputJsonValue, bRound2: null as unknown as Prisma.InputJsonValue },
  });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "psi_key_turned", resource: `couple:${couple.linkId}` });
}

export async function psiSubmitRound2(points: string[]) {
  const { user, couple } = await context();
  if (!couple.bothConsented) throw new Error("Both partners must consent");
  if (!isValidPointSet(points)) throw new Error("Invalid point set");
  const s = await prisma.psiSession.findUnique({ where: { coupleLinkId: couple.linkId } });
  const partnerR1 = couple.role === "a" ? s?.bRound1 : s?.aRound1;
  if (!s || !asSet(partnerR1)) throw new Error("Partner has not started");
  await prisma.psiSession.update({ where: { id: s.id }, data: couple.role === "a" ? { aRound2: points } : { bRound2: points } });
  await appendAudit({ actorId: user.id, subjectId: couple.partner.id, action: "psi_round_relayed", resource: `couple:${couple.linkId}` });
}

/**
 * The person chooses to tell their counsellor which genes the couple shares. Until then the
 * server does not know the outcome. Claimed genes must be carrier genes in their own signed result.
 */
export async function shareOutcomeWithCounsellor(genes: string[]) {
  const { user, couple } = await context();
  const signed = await getOwnSignedResult(user);
  if (!signed) throw new Error("A verified result is required");
  const own = new Set(psiItemsFromSignedResult(signed.bundle, signed.signature, env().LAB_SIGNING_PUBLIC_KEY));
  const shared = [...new Set(genes)].filter((g) => own.has(g)).sort();
  if (shared.length) {
    const existed = await prisma.escalation.findUnique({ where: { userId_code: { userId: user.id, code: "shared_pathogenic_gene" } } });
    await prisma.escalation.upsert({
      where: { userId_code: { userId: user.id, code: "shared_pathogenic_gene" } },
      create: { userId: user.id, code: "shared_pathogenic_gene", severity: "high", detail: shared.join(",") },
      update: { detail: shared.join(","), ...(existed?.status === "resolved" ? { status: "open" } : {}) },
    });
    await appendAudit({ actorId: user.id, subjectId: user.id, action: "couple_outcome_shared", resource: `couple:${couple.linkId}` });
    if (!existed) await appendAudit({ actorId: "system", subjectId: user.id, action: "escalation_raised", resource: "escalation:shared_pathogenic_gene" });
  }
  revalidatePath("/[locale]", "layout");
  redirect({ href: "/support", locale: await getLocale() });
}
