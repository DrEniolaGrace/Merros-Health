"use server";

import { readFileSync } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { applyReclassification, releaseTask } from "@/lib/living/service";
import type { FeedEntry } from "@/lib/living/watch";

function keys() {
  const e = env();
  if (!e.LAB_SIGNING_PRIVATE_KEY) throw new Error("Lab key unavailable");
  return { masterKey: e.ENCRYPTION_MASTER_KEY, labPrivateKey: e.LAB_SIGNING_PRIVATE_KEY };
}

/** Demo: applies the mock national reclassification feed (Hamad's VUS becomes likely pathogenic). */
export async function simulateClinvarUpdate() {
  await requireUser(["counsellor", "admin"]);
  if (env().DEMO_MODE !== "true") throw new Error("Demo only");
  const feed = JSON.parse(readFileSync(path.join(process.cwd(), "data/reference/reclassification-feed.json"), "utf8")) as FeedEntry[];
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

/** The counsellor confirms the person has been told; the amended result is released to them. */
export async function releaseReclassification(taskId: string) {
  const me = await requireUser(["counsellor"]);
  await releaseTask(taskId, me.id);
  revalidatePath("/[locale]", "layout");
}
