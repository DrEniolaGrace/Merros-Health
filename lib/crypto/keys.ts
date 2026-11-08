import "server-only";
import { env } from "@/lib/env";
import { unwrapDataKey } from "./fieldEncryption";

/** Locally the master key comes from the environment; in production from Azure Key Vault. */
export function masterKey(): string {
  return env().ENCRYPTION_MASTER_KEY;
}

export function userDataKey(user: { wrappedDataKey: string }): string {
  return unwrapDataKey(user.wrappedDataKey, masterKey());
}
