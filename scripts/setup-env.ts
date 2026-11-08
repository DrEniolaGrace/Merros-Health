/**
 * Creates .env from .env.example (if missing) and fills any empty secret with a freshly
 * generated value. Never overwrites a value that is already set.
 *
 *   pnpm setup:env
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex } from "@noble/hashes/utils";

const ENV = ".env";
const EXAMPLE = ".env.example";

if (!existsSync(ENV)) {
  writeFileSync(ENV, readFileSync(EXAMPLE, "utf8"));
  console.log("Created .env from .env.example");
}

let text = readFileSync(ENV, "utf8");

function isEmpty(key: string): boolean {
  const m = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  return !m || m[1].trim() === "";
}

function set(key: string, value: string) {
  const re = new RegExp(`^${key}=.*$`, "m");
  text = re.test(text) ? text.replace(re, `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`;
  console.log(`Generated ${key}`);
}

if (isEmpty("ENCRYPTION_MASTER_KEY")) set("ENCRYPTION_MASTER_KEY", randomBytes(32).toString("base64"));
if (isEmpty("SESSION_SECRET")) set("SESSION_SECRET", randomBytes(32).toString("hex"));
if (isEmpty("LAB_SIGNING_PRIVATE_KEY") || isEmpty("LAB_SIGNING_PUBLIC_KEY")) {
  const sk = ed25519.utils.randomSecretKey();
  set("LAB_SIGNING_PRIVATE_KEY", bytesToHex(sk));
  set("LAB_SIGNING_PUBLIC_KEY", bytesToHex(ed25519.getPublicKey(sk)));
}

writeFileSync(ENV, text);
console.log("Done. Remember to set DATABASE_URL and DIRECT_URL (see .env.example).");
