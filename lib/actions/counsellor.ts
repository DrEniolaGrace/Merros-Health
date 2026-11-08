"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { recordStep } from "@/lib/services/pathway";

export async function completeSession(appointmentId: string) {
  const me = await requireUser(["counsellor"]);
  const clinician = await prisma.clinician.findUnique({ where: { userId: me.id } });
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!clinician || !appt || appt.clinicianId !== clinician.id) throw new Error("Not your appointment");
  await prisma.appointment.update({ where: { id: appt.id }, data: { status: "completed" } });
  await prisma.escalation.updateMany({ where: { userId: appt.patientId, status: { in: ["open", "booked"] } }, data: { status: "resolved" } });
  await recordStep(appt.patientId, "counselling_completed");
  await appendAudit({ actorId: me.id, subjectId: appt.patientId, action: "appointment_completed", resource: `appointment:${appt.id}` });
  revalidatePath("/[locale]/counsellor", "page");
}
