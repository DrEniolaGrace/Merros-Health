/**
 * Lab result signing and verification (SPEC 4.1, and input integrity for PSI in 6.1).
 * The issuing lab signs the canonical JSON of the FHIR bundle with Ed25519.
 * Meros only ever holds the lab PUBLIC key; the private key exists in this prototype
 * so the seed script can play the role of the lab.
 */
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";
import { canonicalize } from "@/lib/canonical";

export function signBundle(bundle: unknown, privateKeyHex: string): string {
  const msg = utf8ToBytes(canonicalize(bundle));
  return bytesToHex(ed25519.sign(msg, hexToBytes(privateKeyHex)));
}

/** Returns true only for a well formed signature that matches the bundle and key. Never throws. */
export function verifyBundle(bundle: unknown, signatureHex: string, publicKeyHex: string): boolean {
  try {
    if (!/^[0-9a-f]{128}$/i.test(signatureHex) || !/^[0-9a-f]{64}$/i.test(publicKeyHex)) {
      return false;
    }
    const msg = utf8ToBytes(canonicalize(bundle));
    return ed25519.verify(hexToBytes(signatureHex), msg, hexToBytes(publicKeyHex));
  } catch {
    return false;
  }
}

/** Short stable identifier of a lab public key, stored with each verified result. */
export function keyFingerprint(publicKeyHex: string): string {
  return bytesToHex(sha256(hexToBytes(publicKeyHex))).slice(0, 16);
}

export function publicKeyFromPrivate(privateKeyHex: string): string {
  return bytesToHex(ed25519.getPublicKey(hexToBytes(privateKeyHex)));
}
