/**
 * Hash chained, append only audit log: pure functions (SPEC 11, Audit).
 * hash_n = SHA-256( prevHash_n || canonical(entry_n) ), prevHash_0 = GENESIS.
 * Any edit, deletion or insertion inside the chain breaks verification from that point.
 * (Truncation of the newest rows is detected by anchoring the head hash externally;
 * see docs/SECURITY.md.)
 */
import { createHash } from "node:crypto";
import { canonicalize } from "@/lib/canonical";

export const GENESIS_HASH = "0".repeat(64);

export interface AuditEntry {
  at: Date;
  actorId: string;
  subjectId: string;
  action: string;
  resource: string;
}

export interface ChainedRow extends AuditEntry {
  seq: number;
  prevHash: string;
  hash: string;
}

export function hashEntry(prevHash: string, entry: AuditEntry): string {
  const body = canonicalize({
    at: entry.at.toISOString(),
    actorId: entry.actorId,
    subjectId: entry.subjectId,
    action: entry.action,
    resource: entry.resource,
  });
  return createHash("sha256").update(prevHash).update(body).digest("hex");
}

export type ChainVerification =
  | { ok: true; checked: number; headHash: string }
  | { ok: false; checked: number; brokenAtSeq: number; reason: "prev_hash_mismatch" | "hash_mismatch" };

/** Rows must be ordered by seq ascending and start at the beginning of the chain. */
export function verifyChain(rows: ChainedRow[]): ChainVerification {
  let prev = GENESIS_HASH;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.prevHash !== prev) {
      return { ok: false, checked: i, brokenAtSeq: row.seq, reason: "prev_hash_mismatch" };
    }
    if (hashEntry(row.prevHash, row) !== row.hash) {
      return { ok: false, checked: i, brokenAtSeq: row.seq, reason: "hash_mismatch" };
    }
    prev = row.hash;
  }
  return { ok: true, checked: rows.length, headHash: prev };
}
