import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex } from "@noble/hashes/utils";
import { canonicalize } from "@/lib/canonical";
import { keyFingerprint, signBundle, verifyBundle } from "@/lib/fhir/sign";
import { buildBundle, parseBundle } from "@/lib/fhir/bundle";
import { decryptString, encryptString, generateDataKey, unwrapDataKey, wrapDataKey } from "@/lib/crypto/fieldEncryption";
import { persona, PANEL_GENES, LAB_NAME } from "@/content/personas";

const sk = bytesToHex(ed25519.utils.randomSecretKey());
const pk = bytesToHex(ed25519.getPublicKey(sk));
const otherPk = bytesToHex(ed25519.getPublicKey(ed25519.utils.randomSecretKey()));
const bundle = buildBundle({ accession: "ACC-1", labName: LAB_NAME, issued: "2026-11-01", panelGenes: PANEL_GENES }, persona("mariam").variants!);

describe("canonical JSON", () => {
  it("is independent of key order", () => {
    expect(canonicalize({ b: 1, a: { d: 2, c: 3 } })).toBe(canonicalize({ a: { c: 3, d: 2 }, b: 1 }));
  });
  it("keeps array order", () => {
    expect(canonicalize([2, 1])).not.toBe(canonicalize([1, 2]));
  });
});

describe("lab signature", () => {
  const sig = signBundle(bundle, sk);
  it("valid signature verifies", () => expect(verifyBundle(bundle, sig, pk)).toBe(true));
  it("verifies after a key order reshuffle (canonicalisation)", () => {
    const reshuffled = JSON.parse(JSON.stringify(bundle, Object.keys(bundle).reverse()));
    expect(verifyBundle({ ...reshuffled, ...bundle }, sig, pk)).toBe(true);
  });
  it("tampered content fails (e.g. a classification changed)", () => {
    const tampered = JSON.parse(JSON.stringify(bundle).replace("Pathogenic", "Benign"));
    expect(verifyBundle(tampered, sig, pk)).toBe(false);
  });
  it("adding an extra gene (PSI input inflation) fails", () => {
    const inflated = buildBundle({ accession: "ACC-1", labName: LAB_NAME, issued: "2026-11-01", panelGenes: PANEL_GENES }, [
      ...persona("mariam").variants!, { gene: "SMN1", hgvs: "x", zygosity: "heterozygous", acmg: "pathogenic", clinvarId: null, conditionId: "sma" },
    ]);
    expect(verifyBundle(inflated, sig, pk)).toBe(false);
  });
  it("wrong public key fails", () => expect(verifyBundle(bundle, sig, otherPk)).toBe(false));
  it("flipped signature byte fails", () => {
    const flipped = (sig[0] === "a" ? "b" : "a") + sig.slice(1);
    expect(verifyBundle(bundle, flipped, pk)).toBe(false);
  });
  it("malformed signature or key returns false instead of throwing", () => {
    expect(verifyBundle(bundle, "nothex", pk)).toBe(false);
    expect(verifyBundle(bundle, sig, "short")).toBe(false);
    expect(verifyBundle(bundle, "", "")).toBe(false);
  });
  it("fingerprint is stable", () => expect(keyFingerprint(pk)).toBe(keyFingerprint(pk)));
});

describe("FHIR bundle round trip", () => {
  it("parses back the same variants", () => {
    const parsed = parseBundle(bundle);
    expect(parsed.variants).toEqual(persona("mariam").variants);
    expect(parsed.accession).toBe("ACC-1");
    expect(parsed.panelGenes).toEqual(PANEL_GENES);
  });
  it("rejects malformed bundles", () => {
    expect(() => parseBundle({ resourceType: "Patient" })).toThrow();
    const broken = JSON.parse(JSON.stringify(bundle).replace("LA6668-3", "XX"));
    expect(() => parseBundle(broken)).toThrow();
  });
});

describe("field encryption", () => {
  const master = randomBytes(32).toString("base64");
  const dek = generateDataKey();
  it("round trips", () => {
    expect(decryptString(encryptString("secret عربي", dek), dek)).toBe("secret عربي");
  });
  it("uses a fresh IV each time", () => {
    expect(encryptString("x", dek)).not.toBe(encryptString("x", dek));
  });
  it("detects tampering", () => {
    const ct = encryptString("carrier HBB", dek);
    const parts = ct.split(".");
    const body = Buffer.from(parts[3], "base64url");
    body[0] ^= 1;
    parts[3] = body.toString("base64url");
    expect(() => decryptString(parts.join("."), dek)).toThrow();
  });
  it("fails with the wrong key", () => {
    expect(() => decryptString(encryptString("x", dek), generateDataKey())).toThrow();
  });
  it("fails with the wrong AAD", () => {
    expect(() => decryptString(encryptString("x", dek, "user-a"), dek, "user-b")).toThrow();
  });
  it("wraps and unwraps data keys with the master key", () => {
    const wrapped = wrapDataKey(dek, master);
    expect(wrapped).not.toContain(dek);
    expect(unwrapDataKey(wrapped, master)).toBe(dek);
    expect(() => unwrapDataKey(wrapped, randomBytes(32).toString("base64"))).toThrow();
  });
  it("rejects keys of the wrong length", () => {
    expect(() => encryptString("x", randomBytes(16).toString("base64"))).toThrow();
  });
});
