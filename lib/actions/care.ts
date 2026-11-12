"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { purposeDef } from "@/lib/consent/purposes";

const DAY = 86_400_000;

/**
 * "My Family Doctor" (SPEC 4.10): links a family doctor and, only if the person agrees in the
 * same step, records a time limited consent to share a carrier summary with them.
 */
export async function linkFamilyDoctor(clinicianId: string, shareSummary: boolean) {
  const user = await requireUser(["patient"]);
  const doctor = await prisma.clinician.findUnique({ where: { id: clinicianId } });
  if (!doctor || doctor.service !== "family_medicine") throw new Error("Not a family doctor");
  await prisma.user.update({ where: { id: user.id }, data: { familyDoctorId: doctor.id } });
  await prisma.consent.updateMany({ where: { userId: user.id, purpose: "family_doctor_referral", revokedAt: null }, data: { revokedAt: new Date() } });
  if (shareSummary) {
    const def = purposeDef("family_doctor_referral")!;
    await prisma.consent.create({ data: { userId: user.id, purpose: def.purpose, scope: def.scope, recipient: def.recipient, expiresAt: new Date(Date.now() + (def.defaultDays ?? 90) * DAY) } });
    await appendAudit({ actorId: user.id, subjectId: user.id, action: "consent_granted", resource: "consent:family_doctor_referral" });
  }
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "family_doctor_linked", resource: `clinician:${doctor.licenceNo}` });
  revalidatePath("/[locale]", "layout");
}

export async function unlinkFamilyDoctor() {
  const user = await requireUser(["patient"]);
  await prisma.user.update({ where: { id: user.id }, data: { familyDoctorId: null } });
  await prisma.consent.updateMany({ where: { userId: user.id, purpose: "family_doctor_referral", revokedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath("/[locale]", "layout");
}
