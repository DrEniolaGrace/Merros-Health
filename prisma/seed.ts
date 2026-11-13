/**
 * pnpm seed: loads the synthetic personas, lab signed results, consents, couple links and the
 * counsellor. Safe to run repeatedly (it resets demo data).
 */
import "dotenv/config";
import { resetDemo } from "@/lib/demo/seed";
import { prisma } from "@/lib/db";
import { assertSafeDatabase, databaseHost, PRODUCTION_SEED_PHRASE } from "@/lib/db/guard";

async function main() {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  const labPrivateKey = process.env.LAB_SIGNING_PRIVATE_KEY;
  if (!masterKey || !labPrivateKey) {
    throw new Error("ENCRYPTION_MASTER_KEY and LAB_SIGNING_PRIVATE_KEY are required. Run `pnpm setup:env` first.");
  }
  const ifEmpty = process.argv.includes("--if-empty");
  if (process.argv.includes("--production")) {
    // Deliberate seeding of the live database: needs the exact phrase, typed for this one command.
    if (process.env.CONFIRM !== PRODUCTION_SEED_PHRASE) {
      throw new Error(`Seeding production wipes the live demo data. To proceed set CONFIRM=${PRODUCTION_SEED_PHRASE} for this command.`);
    }
    console.log(`Seeding PRODUCTION database at ${databaseHost(process.env.DATABASE_URL)}.`);
  } else if (!ifEmpty) {
    // A plain seed wipes data, so it may only touch the Docker database or the Neon dev branch.
    assertSafeDatabase("the demo seed");
  }
  if (ifEmpty && (await prisma.user.count()) > 0) {
    console.log("Database already has demo data; skipping seed (run `pnpm seed` to reset).");
    return;
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
