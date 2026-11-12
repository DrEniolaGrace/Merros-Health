import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GENESIS_HASH, hashEntry, verifyChain, type ChainVerification } from "./chain";

type Tx = Prisma.TransactionClient | PrismaClient;

export type AuditAction =
  | "login"
  | "onboarding_completed"
  | "consent_granted"
  | "consent_revoked"
  | "result_imported"
  | "result_import_rejected"
  | "result_viewed"
  | "couple_result_viewed"
  | "psi_key_turned"
  | "psi_round_relayed"
  | "couple_outcome_shared"
  | "copilot_question"
  | "reclassification_detected"
  | "reclassification_released"
  | "relative_invited"
  | "family_doctor_linked"
  | "summary_signed"
  | "summary_viewed"
  | "signals_published"
  | "teachback_answered"
  | "escalation_raised"
  | "appointment_booked"
  | "appointment_completed"
  | "case_viewed"
  | "data_exported"
  | "data_deleted"
  | "audit_verified"
  | "demo_reset";

/** Fixed key for the Postgres advisory lock that serialises appends to the chain. */
const CHAIN_LOCK = 4_242_001;

/**
 * Appends one entry to the hash chained log. Runs inside a transaction holding an advisory
 * lock so concurrent writers cannot fork the chain.
 */
export async function appendAudit(entry: {
  actorId: string;
  subjectId: string;
  action: AuditAction;
  resource: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CHAIN_LOCK})`;
    const last = await tx.accessLog.findFirst({ orderBy: { seq: "desc" }, select: { hash: true } });
    const prevHash = last?.hash ?? GENESIS_HASH;
    // Millisecond precision so the stored timestamp hashes identically after a round trip.
    const at = new Date(Math.floor(Date.now()));
    const hash = hashEntry(prevHash, { ...entry, at });
    return tx.accessLog.create({ data: { ...entry, at, prevHash, hash } });
  });
}

export async function verifyAuditChain(db: Tx = prisma): Promise<ChainVerification> {
  const rows = await db.accessLog.findMany({ orderBy: { seq: "asc" } });
  return verifyChain(rows);
}
