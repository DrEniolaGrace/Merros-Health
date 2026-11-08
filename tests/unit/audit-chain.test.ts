import { describe, expect, it } from "vitest";
import { GENESIS_HASH, hashEntry, verifyChain, type AuditEntry, type ChainedRow } from "@/lib/audit/chain";

function build(entries: AuditEntry[]): ChainedRow[] {
  let prev = GENESIS_HASH;
  return entries.map((e, i) => {
    const hash = hashEntry(prev, e);
    const row = { ...e, seq: i + 1, prevHash: prev, hash };
    prev = hash;
    return row;
  });
}

const entries: AuditEntry[] = Array.from({ length: 5 }, (_, i) => ({
  at: new Date(Date.UTC(2026, 10, 8, 10, i)),
  actorId: `u${i % 2}`,
  subjectId: "u0",
  action: "view_result",
  resource: `labResult:${i}`,
}));

describe("hash chained audit log", () => {
  it("a valid chain verifies", () => {
    const r = verifyChain(build(entries));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.checked).toBe(5);
  });
  it("an empty chain verifies", () => expect(verifyChain([]).ok).toBe(true));
  it("an edited row is detected", () => {
    const rows = build(entries);
    rows[2] = { ...rows[2], action: "export" };
    expect(verifyChain(rows)).toMatchObject({ ok: false, brokenAtSeq: 3, reason: "hash_mismatch" });
  });
  it("an edited row with a recomputed hash is detected at the next row", () => {
    const rows = build(entries);
    rows[2] = { ...rows[2], actorId: "attacker" };
    rows[2].hash = hashEntry(rows[2].prevHash, rows[2]);
    expect(verifyChain(rows)).toMatchObject({ ok: false, brokenAtSeq: 4, reason: "prev_hash_mismatch" });
  });
  it("a deleted row is detected", () => {
    const rows = build(entries);
    rows.splice(1, 1);
    expect(verifyChain(rows)).toMatchObject({ ok: false, brokenAtSeq: 3 });
  });
  it("an inserted row is detected", () => {
    const rows = build(entries);
    const fake = { ...entries[0], action: "fake", seq: 99, prevHash: rows[1].hash, hash: "" };
    fake.hash = hashEntry(fake.prevHash, fake);
    rows.splice(2, 0, fake);
    expect(verifyChain(rows)).toMatchObject({ ok: false, brokenAtSeq: 3 });
  });
  it("timestamps are part of the hash", () => {
    const rows = build(entries);
    rows[0] = { ...rows[0], at: new Date(0) };
    expect(verifyChain(rows).ok).toBe(false);
  });
});
