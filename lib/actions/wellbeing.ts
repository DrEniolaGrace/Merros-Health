"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { encryptString } from "@/lib/crypto/fieldEncryption";
import { userDataKey } from "@/lib/crypto/keys";
import { refreshEscalations } from "@/lib/services/escalation";
import { recordSignal } from "@/lib/services/signals";
import { DISTRESS_THRESHOLD } from "@/lib/escalation/rules";
import { CALLBACK_KINDS, distressBand, offersCallback, validDistress, type CallbackKind, type DistressBand } from "@/lib/wellbeing/distress";
import { sureScore, validRatings, validSure, type Ratings, type SureAnswers } from "@/lib/values/compass";
import { setConsent } from "./patient";

/** "pre" until a counselling session has been completed, "post" after. Used only for anonymous before and after statistics. */
async function phase(userId: string): Promise<"pre" | "post"> {
  const done = await prisma.pathwayEvent.findUnique({ where: { userId_step: { userId, step: "counselling_completed" } } });
  return done ? "post" : "pre";
}

/** Distress Check (SPEC 4.12). Stores the score, re evaluates escalation, and feeds anonymous statistics. */
export async function recordDistress(score: number): Promise<{ band: DistressBand; callbackOffered: boolean }> {
  const user = await requireUser(["patient"]);
  if (!validDistress(score)) throw new Error("Invalid score");
  const when = await phase(user.id);
  await prisma.distressScore.create({ data: { userId: user.id, score, phase: when } });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "distress_recorded", resource: "distress_check" });
  await refreshEscalations(user);
  // A lower score later means the person is coping better: close the open distress reason.
  if (score < DISTRESS_THRESHOLD) {
    await prisma.escalation.updateMany({ where: { userId: user.id, code: "high_distress", status: "open" }, data: { status: "resolved", detail: null } });
  }
  await recordSignal(user.id, when === "pre" ? "distress_pre" : "distress_post", score >= DISTRESS_THRESHOLD ? 1 : 0);
  revalidatePath("/[locale]", "layout");
  return { band: distressBand(score), callbackOffered: offersCallback(score) };
}

/** Same week callback from a counsellor or a psychologist. Only after a score that offers one. */
export async function requestCallback(kind: CallbackKind): Promise<{ ok: boolean }> {
  const user = await requireUser(["patient"]);
  if (!CALLBACK_KINDS.includes(kind)) throw new Error("Invalid callback");
  const latest = await prisma.distressScore.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  if (!latest || !offersCallback(latest.score)) return { ok: false };
  await prisma.distressScore.update({ where: { id: latest.id }, data: { callback: kind } });
  await prisma.escalation.upsert({
    where: { userId_code: { userId: user.id, code: "high_distress" } },
    create: { userId: user.id, code: "high_distress", severity: "urgent", detail: `callback:${kind}` },
    update: { status: "open", detail: `callback:${kind}` },
  });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "callback_requested", resource: `callback:${kind}` });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

const valuesSchema = z.object({ ratings: z.unknown(), sure: z.unknown(), share: z.boolean() });

/**
 * Values Compass (SPEC 4.6). What matters to someone, faith included, is among the most personal
 * things the app holds, so it is stored encrypted with their own data key and shared with the
 * counsellor only through a separate, revocable consent.
 */
export async function saveValues(input: { ratings: Ratings; sure: SureAnswers; share: boolean }): Promise<{ sure: number }> {
  const user = await requireUser(["patient"]);
  const data = valuesSchema.parse(input);
  if (!validRatings(data.ratings) || !validSure(data.sure)) throw new Error("Invalid values");
  const enc = encryptString(JSON.stringify({ ratings: data.ratings, sure: data.sure }), userDataKey(user), `values:${user.id}`);
  await prisma.valuesAssessment.create({ data: { userId: user.id, encData: enc } });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "values_saved", resource: "values_compass" });
  const score = sureScore(data.sure);
  await recordSignal(user.id, (await phase(user.id)) === "pre" ? "sure_pre" : "sure_post", score === 4 ? 1 : 0);
  await setConsent("values_summary_share", data.share);
  return { sure: score };
}
