import "server-only";
import { beyondForCounsellor } from "./beyond";
import { sureScore, validRatings, validSure, type Ratings } from "@/lib/values/compass";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptString } from "@/lib/crypto/fieldEncryption";
import { userDataKey } from "@/lib/crypto/keys";
import { hasActiveConsent } from "@/lib/consent/check";
import { summarisePerson } from "@/lib/risk/engine";
import { comprehensionScores } from "@/lib/teachback/logic";
import { assess, expectedYield, type Relation, type Relative } from "@/lib/family/engine";
import { frequencyFor } from "@/lib/family/frequencies";
import { appendAudit } from "@/lib/audit/log";
import { TEACHBACK } from "@/content/teachback";
import { getOwnResult } from "./results";

/**
 * Counsellor Copilot pre session brief (SPEC 7.1). Built only when the person holds an active
 * counsellor_access consent; every build is written to the audit log. Returns null otherwise.
 */
export async function buildBrief(counsellor: User, patientId: string) {
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: {
      profile: true,
      consents: true,
      escalations: true,
      teachBacks: { orderBy: { createdAt: "asc" } },
      pedigree: true,
      distress: { orderBy: { createdAt: "desc" }, take: 1 },
      values: { orderBy: { createdAt: "desc" }, take: 1 },
      counsellorTasks: { include: { event: true }, orderBy: { createdAt: "desc" } },
      appointments: { include: { clinician: true, note: true, summary: true }, orderBy: { startsAt: "desc" } },
    },
  });
  if (!patient || patient.role !== "patient") return null;
  const consented = hasActiveConsent(patient.consents, "counsellor_access");
  // Risk Beyond the Panel has its own consent, naming the counsellor, separate from result access.
  const beyond = await beyondForCounsellor(counsellor.id, patient);
  const base = { patient, consented, beyond };
  if (!consented) return { ...base, detail: null };

  await appendAudit({ actorId: counsellor.id, subjectId: patient.id, action: "case_viewed", resource: "counsellor_brief" });
  const own = await getOwnResult(patient, { log: false });
  const summary = own.status === "ok" ? summarisePerson(own.result.variants) : null;
  const dek = userDataKey(patient);
  const questions = patient.appointments
    .filter((a) => a.encQuestions)
    .map((a) => decryptString(a.encQuestions!, dek, `questions:${patient.id}`));
  const scores = comprehensionScores(TEACHBACK.map((q) => q.questionId), patient.teachBacks);
  const gene = summary?.genes.find((g) => g.status.kind === "carrier")?.gene ?? null;
  const relatives: Relative[] = patient.pedigree.map((n) => ({ id: n.id, relation: n.relation as Relation, side: n.side as Relative["side"], planning: n.planning, tested: n.tested as Relative["tested"] }));
  const family = gene ? assess(relatives, frequencyFor(gene).f) : [];
  const appointment = patient.appointments.find((a) => a.status === "booked") ?? patient.appointments[0] ?? null;
  const notes = appointment?.note ? decryptString(appointment.note.encNotes, dek, `notes:${patient.id}`) : "";
  const summaryText = appointment?.summary ? decryptString(appointment.summary.encText, dek, `summary:${patient.id}`) : "";

  // The Values Summary is shared only through its own consent, separate from result access.
  let values: { ratings: Ratings; sure: number } | null = null;
  if (patient.values[0] && hasActiveConsent(patient.consents, "values_summary_share")) {
    const data = JSON.parse(decryptString(patient.values[0].encData, dek, `values:${patient.id}`)) as { ratings: unknown; sure: unknown };
    if (validRatings(data.ratings) && validSure(data.sure)) values = { ratings: data.ratings, sure: sureScore(data.sure) };
  }
  const distress = patient.distress[0] ? { score: patient.distress[0].score, callback: patient.distress[0].callback, at: patient.distress[0].createdAt } : null;

  return {
    ...base,
    detail: {
      values,
      distress,
      resultStatus: own.status,
      summary,
      sharedGenes: patient.escalations.find((e) => e.code === "shared_pathogenic_gene")?.detail?.split(",").filter(Boolean) ?? [],
      scores,
      questions,
      gene,
      family,
      familyYield: expectedYield(family),
      appointment,
      notes,
      summaryText,
    },
  };
}
