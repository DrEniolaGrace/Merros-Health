import "server-only";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { canonicalize } from "@/lib/canonical";
import { decryptString, encryptString } from "@/lib/crypto/fieldEncryption";
import { masterKey, userDataKey } from "@/lib/crypto/keys";
import { keyFingerprint, verifyBundle } from "@/lib/fhir/sign";
import { parseBundle, type ParsedResult } from "@/lib/fhir/bundle";
import { hasActiveConsent, coupleConsentsActive } from "@/lib/consent/check";
import { appendAudit } from "@/lib/audit/log";
import { recordStep } from "./pathway";

interface InboxPayload {
  bundle: unknown;
  signature: string;
}

async function readInbox(accession: string): Promise<InboxPayload | null> {
  const row = await prisma.labInbox.findUnique({ where: { accession } });
  if (!row) return null;
  return JSON.parse(decryptString(row.encPayload, masterKey(), "lab-inbox")) as InboxPayload;
}

export type ImportOutcome =
  | { ok: true; variantCount: number }
  | { ok: false; reason: "no_result_waiting" | "signature_invalid" | "accession_mismatch" | "malformed" | "consent_required" };

/**
 * Imports the lab signed result waiting for this person. The signature is verified against the
 * lab public key BEFORE anything is stored; the canonical bundle is then stored encrypted with
 * the person's data key. Requires consent to view their own result.
 */
export async function importResult(user: User, opts: { tamper?: boolean } = {}): Promise<ImportOutcome> {
  const consents = await prisma.consent.findMany({ where: { userId: user.id } });
  if (!hasActiveConsent(consents, "view_own_result")) return { ok: false, reason: "consent_required" };
  if (!user.labAccession) return { ok: false, reason: "no_result_waiting" };
  const payload = await readInbox(user.labAccession);
  if (!payload) return { ok: false, reason: "no_result_waiting" };

  let bundle = payload.bundle;
  if (opts.tamper) {
    // Demo only: flip one classification in transit to show the app refusing it.
    bundle = JSON.parse(JSON.stringify(bundle).replace('"LA6668-3"', '"LA6675-8"').replace('"Pathogenic"', '"Benign"'));
  }

  const pub = env().LAB_SIGNING_PUBLIC_KEY;
  if (!verifyBundle(bundle, payload.signature, pub)) {
    await appendAudit({ actorId: user.id, subjectId: user.id, action: "result_import_rejected", resource: `lab:${user.labAccession}` });
    return { ok: false, reason: "signature_invalid" };
  }

  let parsed: ParsedResult;
  try {
    parsed = parseBundle(bundle);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (parsed.accession !== user.labAccession) return { ok: false, reason: "accession_mismatch" };

  const dek = userDataKey(user);
  await prisma.labResult.upsert({
    where: { userId_accession: { userId: user.id, accession: parsed.accession } },
    create: {
      userId: user.id,
      accession: parsed.accession,
      labKeyId: keyFingerprint(pub),
      signature: payload.signature,
      encBundle: encryptString(canonicalize(bundle), dek, user.id),
      verifiedAt: new Date(),
    },
    update: {},
  });
  await prisma.labInbox.delete({ where: { accession: parsed.accession } });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "result_imported", resource: `lab:${parsed.accession}` });
  await recordStep(user.id, "result_received");
  return { ok: true, variantCount: parsed.variants.length };
}

export async function hasResultWaiting(user: User): Promise<boolean> {
  if (!user.labAccession) return false;
  return (await prisma.labInbox.count({ where: { accession: user.labAccession } })) > 0;
}

/**
 * Decrypts a stored result and re verifies its lab signature (defence in depth).
 * Internal: callers must have checked consent.
 */
async function decryptResult(user: User): Promise<(ParsedResult & { verifiedAt: Date; labKeyId: string }) | null> {
  const row = await prisma.labResult.findFirst({ where: { userId: user.id, releasedAt: { not: null } }, orderBy: { importedAt: "desc" } });
  if (!row) return null;
  const bundle = JSON.parse(decryptString(row.encBundle, userDataKey(user), user.id));
  if (!verifyBundle(bundle, row.signature, env().LAB_SIGNING_PUBLIC_KEY)) {
    throw new Error("Stored result failed signature verification");
  }
  return { ...parseBundle(bundle), verifiedAt: row.verifiedAt, labKeyId: row.labKeyId };
}

export type OwnResult =
  | { status: "no_consent" }
  | { status: "waiting" }
  | { status: "none" }
  | { status: "ok"; result: ParsedResult & { verifiedAt: Date; labKeyId: string } };

/** The person's own result, gated by consent and logged. */
export async function getOwnResult(user: User, { log = true } = {}): Promise<OwnResult> {
  const consents = await prisma.consent.findMany({ where: { userId: user.id } });
  if (!hasActiveConsent(consents, "view_own_result")) return { status: "no_consent" };
  const result = await decryptResult(user);
  if (!result) return (await hasResultWaiting(user)) ? { status: "waiting" } : { status: "none" };
  if (log) await appendAudit({ actorId: user.id, subjectId: user.id, action: "result_viewed", resource: `lab:${result.accession}` });
  return { status: "ok", result };
}

/**
 * The person's own lab signed result, for their own device only (Blind Couple Match runs on the
 * device). Consent gated; the signature is re verified before release.
 */
export async function getOwnSignedResult(user: User): Promise<{ bundle: unknown; signature: string } | null> {
  const consents = await prisma.consent.findMany({ where: { userId: user.id } });
  if (!hasActiveConsent(consents, "view_own_result")) return null;
  const row = await prisma.labResult.findFirst({ where: { userId: user.id, releasedAt: { not: null } }, orderBy: { importedAt: "desc" } });
  if (!row) return null;
  const bundle = JSON.parse(decryptString(row.encBundle, userDataKey(user), user.id));
  if (!verifyBundle(bundle, row.signature, env().LAB_SIGNING_PUBLIC_KEY)) throw new Error("Stored result failed signature verification");
  return { bundle, signature: row.signature };
}

export type CoupleStatus =
  | { status: "no_partner" }
  | {
      status: "linked";
      linkId: string;
      role: "a" | "b";
      partner: User;
      selfConsented: boolean;
      bothConsented: boolean;
      selfHasResult: boolean;
    };

/**
 * Couple link and Dual Key state. The server never compares the two results: matching happens
 * on the partners' devices (lib/psi/protocol.ts) and the server only relays blinded points.
 */
export async function getCoupleStatus(user: User): Promise<CoupleStatus> {
  const link = await prisma.coupleLink.findFirst({
    where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] },
    include: { partnerA: true, partnerB: true },
  });
  if (!link) return { status: "no_partner" };
  const role = link.partnerAId === user.id ? "a" : "b";
  const partner = role === "a" ? link.partnerB : link.partnerA;
  const [mine, theirs, results] = await Promise.all([
    prisma.consent.findMany({ where: { userId: user.id } }),
    prisma.consent.findMany({ where: { userId: partner.id } }),
    prisma.labResult.count({ where: { userId: user.id, releasedAt: { not: null } } }),
  ]);
  return {
    status: "linked",
    linkId: link.id,
    role,
    partner,
    selfConsented: hasActiveConsent(mine, "couple_comparison"),
    bothConsented: coupleConsentsActive(mine, theirs),
    selfHasResult: results > 0 && hasActiveConsent(mine, "view_own_result"),
  };
}
