import "dotenv/config";
import { execSync } from "node:child_process";
import { assertSafeDatabase } from "../../lib/db/guard";

/** Resets the synthetic demo data so every run starts from the same state. Never on production. */
export default function globalSetup() {
  assertSafeDatabase("the browser tests");
  execSync("pnpm seed", { stdio: "inherit" });
}
