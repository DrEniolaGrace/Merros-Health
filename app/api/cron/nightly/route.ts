import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/demo/policy";
import { resetDemo } from "@/lib/demo/seed";
import { runVariantWatch } from "@/lib/living/service";
import { pruneRateLimits } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Nightly job (Vercel cron, see vercel.json; an Azure Container Apps job later):
 *   1. resets the synthetic demo data so every day starts fresh for reviewers,
 *   2. clears old rate limit counters,
 *   3. runs VariantWatch against live ClinVar (SPEC 6.3).
 * Only callable with the CRON_SECRET. It touches whatever database this deployment uses.
 */
export async function GET(request: Request) {
  if (!cronAuthorised(request.headers.get("authorization"))) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  const labPrivateKey = process.env.LAB_SIGNING_PRIVATE_KEY;
  if (process.env.DEMO_MODE === "false" || !masterKey || !labPrivateKey) return NextResponse.json({ error: "demo reset unavailable" }, { status: 409 });

  const keys = { masterKey, labPrivateKey };
  const seeded = await resetDemo(keys);
  const pruned = await pruneRateLimits();
  const watch = await runVariantWatch(keys, { apiKey: process.env.NCBI_API_KEY || undefined });
  return NextResponse.json({ ok: true, personas: seeded.users, rateLimitRowsRemoved: pruned.count, variantWatch: watch });
}
