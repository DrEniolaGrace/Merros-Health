import { execSync } from "node:child_process";

/** Resets the synthetic demo data so every run starts from the same state. */
export default function globalSetup() {
  execSync("pnpm seed", { stdio: "inherit" });
}
