/**
 * Database safety rule (CLAUDE.md): tests, seeds and other destructive development commands may
 * only touch the local Docker database or the Neon "dev" branch. The live "production" branch is
 * used by the deployed site only. This guard makes a wrong DATABASE_URL fail loudly instead of
 * wiping production.
 *
 * Safe hosts: localhost, the compose service name, and the hosts listed in SAFE_DATABASE_HOSTS
 * (comma separated, in .env: the Neon dev branch endpoint). Neon gives every branch its own
 * endpoint host, so the host identifies the branch.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "postgres"]);

/** Neon pooled and direct hosts of one branch differ only by "-pooler". */
const normalise = (host: string) => host.trim().toLowerCase().replace("-pooler.", ".");

export function databaseHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isSafeDatabase(env: Record<string, string | undefined> = process.env): boolean {
  const safe = new Set((env.SAFE_DATABASE_HOSTS ?? "").split(",").map(normalise).filter(Boolean));
  for (const url of [env.DATABASE_URL, env.DIRECT_URL]) {
    if (!url) continue;
    const host = databaseHost(url);
    if (!host) return false;
    if (!LOCAL_HOSTS.has(host) && !safe.has(normalise(host))) return false;
  }
  return databaseHost(env.DATABASE_URL) !== null;
}

export function assertSafeDatabase(what: string, env: Record<string, string | undefined> = process.env): void {
  if (isSafeDatabase(env)) return;
  const host = databaseHost(env.DATABASE_URL) ?? "(not set)";
  throw new Error(
    `Refusing to run ${what}: DATABASE_URL points at "${host}", which is not the local Docker database or a host in SAFE_DATABASE_HOSTS. ` +
      `Tests and seeds must never run against the production database. Point .env at the Neon "dev" branch, or use the Docker database.`,
  );
}

/** The exact phrase that must be supplied to seed the production branch on purpose. */
export const PRODUCTION_SEED_PHRASE = "seed-production";
