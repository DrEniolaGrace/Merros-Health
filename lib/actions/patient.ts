"use server";

import { z } from "zod";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, getSession } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { purposeDef, PURPOSES, type ConsentPurpose } from "@/lib/consent/purposes";
import { importResult, hasResultWaiting, type ImportOutcome } from "@/lib/services/results";
import { refreshCoupleEscalations, refreshEscalations } from "@/lib/services/escalation";
import { forgetSignals, recordSignal } from "@/lib/services/signals";
import { recordStep } from "@/lib/services/pathway";
import { syncBeyondPanel } from "@/lib/services/beyond";
import { TEACHBACK } from "@/content/teachback";
import { isQuestionDone, nextExplanationIndex, teachBackFailedTwice } from "@/lib/teachback/logic";
import { redirect } from "@/i18n/navigation";
import { verifyAuditChain } from "@/lib/audit/log";
import { encryptString } from "@/lib/crypto/fieldEncryption";
import { userDataKey } from "@/lib/crypto/keys";

const DAY = 86_400_000;
const purposeEnum = z.enum(PURPOSES.map((p) => p.purpose) as [ConsentPurpose, ...ConsentPurpose[]]);

async function grant(userId: string, purpose: ConsentPurpose) {
  const def = purposeDef(purpose)!;
  await prisma.consent.create({
    data: {
      userId,
      purpose,
      scope: def.scope,
      recipient: def.recipient,
      expiresAt: def.defaultDays ? new Date(Date.now() + def.defaultDays * DAY) : null,
    },
  });
  await appendAudit({ actorId: userId, subjectId: userId, action: "consent_granted", resource: `consent:${purpose}` });
}

async function revoke(userId: string, purpose: ConsentPurpose) {
  const r = await prisma.consent.updateMany({ where: { userId, purpose, revokedAt: null }, data: { revokedAt: new Date() } });
  if (r.count) await appendAudit({ actorId: userId, subjectId: userId, action: "consent_revoked", resource: `consent:${purpose}` });
}

const onboardingSchema = z.object({
  locale: z.enum(["ar", "en"]),
  readingLevel: z.enum(["simple", "standard", "detailed"]),
  mediaPref: z.enum(["text", "audio", "both"]),
  pregnancyStatus: z.enum(["none", "trying", "pregnant", "prefer_not_to_say"]),
  consents: z.array(purposeEnum),
});

export async function saveOnboarding(input: z.infer<typeof onboardingSchema>) {
  const user = await requireUser(["patient"]);
  const data = onboardingSchema.parse(input);
  await prisma.profile.update({
    where: { userId: user.id },
    data: { locale: data.locale, readingLevel: data.readingLevel, mediaPref: data.mediaPref, pregnancyStatus: data.pregnancyStatus, onboardedAt: new Date() },
  });
  // Replace any earlier choices with exactly what was chosen now.
  for (const p of PURPOSES) await revoke(user.id, p.purpose);
  for (const p of new Set(data.consents)) await grant(user.id, p);
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "onboarding_completed", resource: "profile" });
  await refreshCoupleEscalations(user);
  const next = data.consents.includes("view_own_result") && (await hasResultWaiting(user)) ? "/import" : "/home";
  redirect({ href: next, locale: data.locale });
}

export async function setConsent(purpose: ConsentPurpose, on: boolean) {
  const user = await requireUser(["patient"]);
  const p = purposeEnum.parse(purpose);
  if (on) {
    await revoke(user.id, p);
    await grant(user.id, p);
  } else {
    await revoke(user.id, p);
    // Withdrawing the Dual Key wipes the relay state, so nothing further can be matched.
    if (p === "couple_comparison") {
      await prisma.psiSession.deleteMany({ where: { coupleLink: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] } } });
    }
  }
  // Risk Beyond the Panel exists only while both partners consent, wherever the switch was changed.
  if (p === "beyond_panel") await syncBeyondPanel(user.id);
  await refreshCoupleEscalations(user);
  revalidatePath("/[locale]", "layout");
}

export async function importAction(tamper: boolean): Promise<ImportOutcome> {
  const user = await requireUser(["patient"]);
  const outcome = await importResult(user, { tamper });
  if (outcome.ok) {
    await refreshCoupleEscalations(user);
    // The result, couple and home screens all change once a result exists: drop any cached copy
    // the browser holds from before the import, so "My result" opens the new result at once.
    revalidatePath("/[locale]", "layout");
  }
  return outcome;
}

export async function requestMedicalAdvice() {
  const user = await requireUser(["patient"]);
  await refreshEscalations(user, { medicalAdviceRequested: true });
  redirect({ href: "/support", locale: await getLocale() });
}

export async function answerTeachBack(questionId: string, optionId: string, explanationShown: number) {
  const user = await requireUser(["patient"]);
  const q = TEACHBACK.find((x) => x.questionId === questionId);
  if (!q) throw new Error("Unknown question");
  const prior = await prisma.teachBackAttempt.findMany({ where: { userId: user.id, questionId }, orderBy: { createdAt: "asc" } });
  const correct = optionId === q.correct;
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  await prisma.teachBackAttempt.create({
    data: {
      userId: user.id,
      questionId,
      attemptNo: prior.length + 1,
      correct,
      explanation: q.explanations[explanationShown]?.kind ?? "standard",
      locale: profile?.locale ?? "ar",
      readingLevel: profile?.readingLevel ?? "standard",
    },
  });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "teachback_answered", resource: `teachback:${questionId}` });
  if (prior.length === 0) await recordSignal(user.id, "teachback_first", correct ? 1 : 0);

  const all = await prisma.teachBackAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const allDone = TEACHBACK.every((t) => isQuestionDone(all.filter((a) => a.questionId === t.questionId)));
  if (allDone) await recordStep(user.id, "understood");
  const failedTwice = teachBackFailedTwice(all);
  if (failedTwice) await refreshEscalations(user);
  const mine = all.filter((a) => a.questionId === questionId);
  return { correct, nextExplanation: nextExplanationIndex(mine, q.explanations.length), allDone, escalated: failedTwice };
}

export async function resetTeachBack() {
  const user = await requireUser(["patient"]);
  await prisma.teachBackAttempt.deleteMany({ where: { userId: user.id } });
  revalidatePath("/[locale]/teach-back", "page");
}

const bookSchema = z.object({
  mode: z.enum(["in_person", "video", "phone"]),
  startsAt: z.string().datetime(),
  clinicianId: z.string().max(40).optional(),
  /** Questions for the session; stored encrypted with the person's own data key. */
  questions: z.string().max(1500).optional(),
});

export async function bookSession(input: z.infer<typeof bookSchema>) {
  const user = await requireUser(["patient"]);
  const data = bookSchema.parse(input);
  const startsAt = new Date(data.startsAt);
  if (startsAt.getTime() < Date.now()) throw new Error("Slot in the past");
  const clinician = data.clinicianId
    ? await prisma.clinician.findUnique({ where: { id: data.clinicianId } })
    : await prisma.clinician.findFirst({ where: { userId: { not: null } } });
  if (!clinician) throw new Error("No counsellor available");
  const encQuestions = data.questions?.trim() ? encryptString(data.questions.trim(), userDataKey(user), `questions:${user.id}`) : null;
  await prisma.appointment.create({ data: { patientId: user.id, clinicianId: clinician.id, mode: data.mode, startsAt, encQuestions } });
  await prisma.escalation.updateMany({ where: { userId: user.id, status: "open" }, data: { status: "booked" } });
  await recordStep(user.id, "counselling_booked");
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "appointment_booked", resource: `appointment:${data.mode}` });
  revalidatePath("/[locale]", "layout");
}

export async function verifyIntegrityAction() {
  const user = await requireUser();
  const r = await verifyAuditChain();
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "audit_verified", resource: "access_log" });
  return r.ok ? { ok: true as const, checked: r.checked } : { ok: false as const, brokenAtSeq: r.brokenAtSeq };
}

export async function deleteMyData(confirmation: string) {
  const user = await requireUser(["patient"]);
  if (!["DELETE", "حذف"].includes(confirmation.trim())) throw new Error("Confirmation text does not match");
  if (user.labAccession) await prisma.labInbox.deleteMany({ where: { accession: user.labAccession } });
  await forgetSignals(user.id);
  await prisma.user.delete({ where: { id: user.id } });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "data_deleted", resource: "account" });
  const session = await getSession();
  session.destroy();
  redirect({ href: "/", locale: await getLocale() });
}
