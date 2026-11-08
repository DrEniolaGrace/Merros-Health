import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { getOwnResult } from "@/lib/services/results";

/** Export all of the signed in person's data as readable JSON (SPEC 4.13). */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [consents, escalations, pathway, teachBack, appointments, access] = await Promise.all([
    prisma.consent.findMany({ where: { userId: user.id } }),
    prisma.escalation.findMany({ where: { userId: user.id } }),
    prisma.pathwayEvent.findMany({ where: { userId: user.id } }),
    prisma.teachBackAttempt.findMany({ where: { userId: user.id } }),
    prisma.appointment.findMany({ where: { patientId: user.id } }),
    prisma.accessLog.findMany({ where: { subjectId: user.id }, orderBy: { seq: "asc" } }),
  ]);
  const own = await getOwnResult(user, { log: false });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "data_exported", resource: "export" });

  const body = {
    notice: "Synthetic demo data. Meros export.",
    exportedAt: new Date().toISOString(),
    person: { id: user.id, name: { en: user.displayNameEn, ar: user.displayNameAr }, profile: user.profile },
    result: own.status === "ok" ? own.result : { status: own.status },
    consents,
    escalations,
    pathway,
    teachBack,
    appointments,
    accessLog: access,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="meros-export-${user.personaKey}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
