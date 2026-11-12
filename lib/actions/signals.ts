"use server";

import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { secureRng } from "@/lib/signals/dp";
import { publishRelease } from "@/lib/signals/store";

/** Programme admin publishes a new differentially private release. Refused when the budget is used up. */
export async function publishSignals(): Promise<{ ok: true } | { ok: false; reason: "budget_exhausted" }> {
  const user = await requireUser(["admin"]);
  const r = await publishRelease(new Date(), secureRng);
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "signals_published", resource: r.ok ? `release:${r.id}` : "release:refused_budget" });
  return r.ok ? { ok: true } : { ok: false, reason: r.reason };
}
