/**
 * pnpm seed: loads the synthetic personas, lab signed results, consents, couple links and the
 * counsellor. Safe to run repeatedly (it resets demo data).
 */
import "dotenv/config";
import { resetDemo } from "@/lib/demo/seed";
import { prisma } from "@/lib/db";

async function main() {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  const labPrivateKey = process.env.LAB_SIGNING_PRIVATE_KEY;
  if (!masterKey || !labPrivateKey) {
    throw new Error("ENCRYPTION_MASTER_KEY and LAB_SIGNING_PRIVATE_KEY are required. Run `pnpm setup:env` first.");
  }
  const r = await resetDemo({ masterKey, labPrivateKey });
  console.log(`Seeded ${r.users} synthetic personas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
