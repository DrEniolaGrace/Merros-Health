"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { recordStep } from "@/lib/services/pathway";
import { encryptString } from "@/lib/crypto/fieldEncryption";
import { userDataKey } from "@/lib/crypto/keys";
import { hasActiveConsent } from "@/lib/consent/check";
import { getProvider } from "@/lib/ai/provider";
import { draftSummary } from "@/lib/ai/summary";

/** The counsellor's own clinician record and an appointment that belongs to them. */
async function mine(appointmentId: string) {
  const me = await requireUser(["counsellor"]);
  const clinician = await prisma.clinician.findUnique({ where: { userId: me.id } });
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { patient: { include: { profile: true, consents: true } } } });
  if (!clinician || !appt || appt.clinicianId !== clinician.id) throw new Error("Not your appointment");
  return { me, clinician, appt };
}

async function complete(appointmentId: string, patientId: string, counsellorId: string) {
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "completed" } });
  await prisma.escalation.updateMany({ where: { userId: patientId, status: { in: ["open", "booked"] } }, data: { status: "resolved" } });
  await recordStep(patientId, "counselling_completed");
  await appendAudit({ actorId: counsellorId, subjectId: patientId, action: "appointment_completed", resource: `appointment:${appointmentId}` });
}

export async function completeSession(appointmentId: string) {
  const { me, appt } = await mine(appointmentId);
  await complete(appt.id, appt.patientId, me.id);
  revalidatePath("/[locale]", "layout");
}

const notesInput = z.object({ appointmentId: z.string().max(40), notes: z.string().min(1).max(4000) });

/**
 * Saves the counsellor's private notes (encrypted with the patient's data key) and returns a
 * DRAFT summary in the patient's language and reading level. Nothing is shown to the patient.
 */
export async function saveNotesAndDraft(input: z.infer<typeof notesInput>): Promise<{ draft: string; provider: string }> {
  const { appointmentId, notes } = notesInput.parse(input);
  const { appt } = await mine(appointmentId);
  if (!hasActiveConsent(appt.patient.consents, "counsellor_access")) throw new Error("No counsellor access consent");
  const enc = encryptString(notes, userDataKey(appt.patient), `notes:${appt.patientId}`);
  await prisma.counsellorNote.upsert({ where: { appointmentId }, create: { appointmentId, encNotes: enc }, update: { encNotes: enc } });
  const provider = getProvider();
  const draft = await draftSummary(notes, appt.patient.profile?.locale ?? "ar", appt.patient.profile?.readingLevel ?? "standard", provider);
  return { draft, provider: provider.name };
}

const signInput = z.object({ appointmentId: z.string().max(40), text: z.string().min(20).max(4000) });

/**
 * The counsellor signs the reviewed summary. Only now is it released to the patient, labelled
 * Clinical Advice with the counsellor's name and credentials. The session is marked completed.
 */
export async function signSummary(input: z.infer<typeof signInput>) {
  const { appointmentId, text } = signInput.parse(input);
  const { me, clinician, appt } = await mine(appointmentId);
  const enc = encryptString(text.trim(), userDataKey(appt.patient), `summary:${appt.patientId}`);
  const data = { encText: enc, locale: appt.patient.profile?.locale ?? "ar", signedById: clinician.id, signedAt: new Date() };
  await prisma.patientSummary.upsert({ where: { appointmentId }, create: { appointmentId, patientId: appt.patientId, ...data }, update: data });
  await appendAudit({ actorId: me.id, subjectId: appt.patientId, action: "summary_signed", resource: `appointment:${appointmentId}` });
  if (appt.status !== "completed") await complete(appt.id, appt.patientId, me.id);
  revalidatePath("/[locale]", "layout");
}
