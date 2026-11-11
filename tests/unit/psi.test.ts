import { describe, expect, it } from "vitest";
import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex } from "@noble/hashes/utils";
import { PSI_SET_SIZE, PsiError, decodePointSet, intersect, isValidPointSet, newSecret, psiItemsFromSignedResult, round1, round2 } from "@/lib/psi/protocol";
import { buildBundle } from "@/lib/fhir/bundle";
import { signBundle } from "@/lib/fhir/sign";
import { LAB_NAME, PANEL_GENES, persona } from "@/content/personas";

/** Runs the whole protocol and records every message the relay would see. */
function run(a: string[], b: string[]) {
  const ka = newSecret();
  const kb = newSecret();
  const a1 = round1(a, ka);
  const b1 = round1(b, kb);
  const a2 = round2(b1.blinded, ka); // A's round 2: B's points raised to a
  const b2 = round2(a1.blinded, kb);
  return {
    aShared: intersect(a1.order, b2, b1.blinded, ka),
    bShared: intersect(b1.order, a2, a1.blinded, kb),
    relay: [a1.blinded, b1.blinded, a2, b2],
  };
}

describe("PSI correctness", () => {
  const cases: [string[], string[], string[]][] = [
    [["HBB", "GJB2"], ["HBB", "GJB2"], ["GJB2", "HBB"]],
    [["HBB", "GJB2"], ["HBB"], ["HBB"]],
    [["SMN1"], [], []],
    [[], [], []],
    [["HBB"], ["CFTR"], []],
    [["HBB", "CFTR", "SMN1", "GJB2"], ["GJB2", "HBA1", "SMN1"], ["GJB2", "SMN1"]],
  ];
  it.each(cases)("%j ∩ %j = %j for both partners", (a, b, expected) => {
    const r = run(a, b);
    expect(r.aShared).toEqual(expected);
    expect(r.bShared).toEqual(expected);
  });

  it("matches the real demo personas (Mariam and Khalid share GJB2 and HBB)", () => {
    const genes = (key: string) => [...new Set(persona(key).variants!.map((v) => v.gene))];
    expect(run(genes("mariam"), genes("khalid")).aShared).toEqual(["GJB2", "HBB"]);
    expect(run(genes("noura"), genes("faisal")).aShared).toEqual([]);
  });

  it("random sets: intersection always equals the true intersection", () => {
    const pool = ["HBB", "HBA1", "HBA2", "SMN1", "GJB2", "CFTR", "G6PD", "PAH", "GBA", "HEXA"];
    for (let n = 0; n < 6; n++) {
      const pick = () => pool.filter(() => Math.random() < 0.4).slice(0, PSI_SET_SIZE);
      const a = pick();
      const b = pick();
      expect(run(a, b).aShared).toEqual(a.filter((g) => b.includes(g)).sort());
    }
  }, 30_000);
});

describe("what the relay (server) sees", () => {
  const r = run(["HBB", "GJB2"], ["HBB", "SMN1", "CFTR"]);
  it("only fixed size sets of valid 32 byte points, never gene names", () => {
    for (const msg of r.relay) {
      expect(msg).toHaveLength(PSI_SET_SIZE);
      expect(isValidPointSet(msg)).toBe(true);
      expect(JSON.stringify(msg)).not.toMatch(/HBB|GJB2|SMN1|CFTR/);
    }
  });
  it("set size hides how many carrier genes each partner has", () => {
    expect(round1([], newSecret()).blinded).toHaveLength(PSI_SET_SIZE);
    expect(round1(["HBB", "GJB2", "SMN1"], newSecret()).blinded).toHaveLength(PSI_SET_SIZE);
  });
  it("the same gene blinds to different points each run and for each partner", () => {
    const k = newSecret();
    const x = round1(["HBB"], k);
    const y = round1(["HBB"], newSecret());
    const px = x.blinded[x.order.indexOf("HBB")];
    const py = y.blinded[y.order.indexOf("HBB")];
    expect(px).not.toBe(py);
  });
  it("without a secret, the relay cannot compute the intersection", () => {
    // The relay holds all four messages; no pair of sets has a point in common.
    const [a1, b1, a2, b2] = r.relay.map((m) => new Set(m));
    const overlap = (s: Set<string>, t: Set<string>) => [...s].some((x) => t.has(x));
    expect(overlap(a1, b1)).toBe(false);
    expect(overlap(a1, a2) || overlap(a1, b2) || overlap(b1, a2) || overlap(b1, b2)).toBe(false);
    // a2 and b2 DO share points for shared genes, but the relay cannot tell which gene they are.
    expect(overlap(a2, b2)).toBe(true);
  });
});

describe("malformed and hostile inputs", () => {
  const k = newSecret();
  const good = round1(["HBB"], k).blinded;
  it("rejects wrong sizes, duplicates, bad encodings and the identity point", () => {
    expect(() => decodePointSet(good.slice(1))).toThrow(PsiError);
    expect(() => decodePointSet([...good.slice(1), good[1]])).toThrow(PsiError);
    expect(() => decodePointSet([...good.slice(1), "zz".repeat(32)])).toThrow(PsiError);
    expect(() => decodePointSet([...good.slice(1), "ff".repeat(32)])).toThrow(PsiError);
    expect(() => decodePointSet([...good.slice(1), "00".repeat(32)])).toThrow(PsiError);
    expect(isValidPointSet("nope")).toBe(false);
  });
  it("refuses more items than the fixed set size (blocks whole panel inflation)", () => {
    expect(() => round1(Array.from({ length: PSI_SET_SIZE + 1 }, (_, i) => `G${i}`), k)).toThrow(PsiError);
  });
  it("rejects invalid secrets", () => {
    expect(() => round1(["HBB"], "0".repeat(64))).toThrow(PsiError);
    expect(() => round2(good, "xyz")).toThrow(PsiError);
  });
});

describe("input integrity: only lab signed results can enter the protocol", () => {
  const sk = bytesToHex(ed25519.utils.randomSecretKey());
  const pk = bytesToHex(ed25519.getPublicKey(sk));
  const meta = { accession: "A1", labName: LAB_NAME, issued: "2026-11-01", panelGenes: PANEL_GENES };
  const bundle = buildBundle(meta, persona("mariam").variants!);
  const sig = signBundle(bundle, sk);

  it("accepts a signed result and returns its carrier genes", () => {
    expect(psiItemsFromSignedResult(bundle, sig, pk)).toEqual(["GJB2", "HBB"]);
  });
  it("refuses an unsigned result", () => {
    expect(() => psiItemsFromSignedResult(bundle, "", pk)).toThrow("not signed");
  });
  it("refuses a result with extra genes added after signing", () => {
    const inflated = buildBundle(meta, [
      ...persona("mariam").variants!,
      ...["SMN1", "CFTR"].map((gene) => ({ gene, hgvs: "x", zygosity: "heterozygous" as const, acmg: "pathogenic" as const, clinvarId: null, conditionId: "x" })),
    ]);
    expect(() => psiItemsFromSignedResult(inflated, sig, pk)).toThrow(PsiError);
  });
  it("refuses a result signed by someone other than the lab", () => {
    const other = bytesToHex(ed25519.utils.randomSecretKey());
    expect(() => psiItemsFromSignedResult(bundle, signBundle(bundle, other), pk)).toThrow(PsiError);
  });
  it("a VUS never enters the match", () => {
    const b = buildBundle(meta, persona("hamad").variants!);
    expect(psiItemsFromSignedResult(b, signBundle(b, sk), pk)).toEqual([]);
  });
});
