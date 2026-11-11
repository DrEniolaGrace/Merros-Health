/**
 * pnpm variant-watch: the VariantWatch scheduled job (nightly Azure Container Apps job in
 * production). Checks every watched variant against live ClinVar and records any change.
 */
import "dotenv/config";
import { prisma } from "@/lib/db";
import { runVariantWatch } from "@/lib/living/service";

async function main() {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  const labPrivateKey = process.env.LAB_SIGNING_PRIVATE_KEY;
  if (!masterKey || !labPrivateKey) throw new Error("ENCRYPTION_MASTER_KEY and LAB_SIGNING_PRIVATE_KEY are required");
  const r = await runVariantWatch({ masterKey, labPrivateKey }, { apiKey: process.env.NCBI_API_KEY || undefined });
  console.log(r.error ? `VariantWatch: ${r.error}` : `VariantWatch: checked ${r.checked} variants, ${r.changed} reclassified.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
