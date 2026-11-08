/**
 * Field level encryption (SPEC 11, Crypto).
 * Envelope scheme: each user has a random 256 bit data key (DEK). The DEK is stored only
 * wrapped (AES-256-GCM) by the master key. Sensitive fields are encrypted with the DEK.
 * Locally the master key comes from ENCRYPTION_MASTER_KEY; in production from Azure Key Vault.
 *
 * Ciphertext format: "v1.<iv b64url>.<tag b64url>.<ciphertext b64url>"
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const ALG = "aes-256-gcm";

function toKey(keyB64: string): Buffer {
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) throw new Error("Encryption key must be 32 bytes (base64)");
  return key;
}

export function encryptString(plaintext: string, keyB64: string, aad = ""): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, toKey(keyB64), iv);
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(
    ".",
  );
}

/** Throws if the ciphertext was tampered with, the key is wrong, or the AAD differs. */
export function decryptString(payload: string, keyB64: string, aad = ""): string {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("Unsupported ciphertext format");
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv(ALG, toKey(keyB64), Buffer.from(ivB64, "base64url"));
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString(
    "utf8",
  );
}

export function generateDataKey(): string {
  return randomBytes(32).toString("base64");
}

export function wrapDataKey(dataKeyB64: string, masterKeyB64: string): string {
  return encryptString(dataKeyB64, masterKeyB64, "meros-dek");
}

export function unwrapDataKey(wrapped: string, masterKeyB64: string): string {
  return decryptString(wrapped, masterKeyB64, "meros-dek");
}
