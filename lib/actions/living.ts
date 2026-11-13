"use server";

import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { applyReclassification, releaseTask, runVariantWatch } from "@/lib/living/service";
import type { FeedEntry } from "@/lib/living/watch";
import feedJson from "@/data/reference/reclassification-feed.json";

function keys() {
  const e = env();
  if (!e.LAB_SIGNING_PRIVATE_KEY) throw new Error("Lab key unavailable");
  return { masterKey: e.ENCRYPTION_MASTER_KEY, labPrivateKey: e.LAB_SIGNING_PRIVATE_KEY };
}

/** Demo: applies the mock national reclassification feed (Hamad's VUS becomes likely pathogenic). */
export async function simulateClinvarUpdate() {
  await requireUser(["counsellor", "admin"]);
  if (env().DEMO_MODE !== "true") throw new Error("Demo only");
  const feed = feedJson as FeedEntry[];
  let affected = 0;
  let tasks = 0;
  for (const entry of feed) {
    const r = await applyReclassification(entry, keys());
    affected += r.affected;
    tasks += r.tasks;
  }
  revalidatePath("/[locale]", "layout");
  return { affected, tasks };
}

/** Manual VariantWatch run: checks every watched variant against live ClinVar now (the nightly job does the same). */
export async function checkClinvarNow() {
  await requireUser(["admin"]);
  const r = await runVariantWatch(keys(), { apiKey: process.env.NCBI_API_KEY || undefined });
  revalidatePath("/[locale]", "layout");
  return r;
}

/** The counsellor confirms the person has been told; the amended result is released to them. */
export async function releaseReclassification(taskId: string) {
  const me = await requireUser(["counsellor"]);
  await releaseTask(taskId, me.id);
  revalidatePath("/[locale]", "layout");
}
