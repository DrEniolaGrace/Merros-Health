import "server-only";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emptyContext, evaluateEscalation, type Escalation } from "@/lib/escalation/rules";
import { appendAudit } from "@/lib/audit/log";
import { getOwnResult } from "./results";

/**
 * Re evaluates the escalation rules for one person from current data and records any newly
 * fired reason. Result based rules only run once the person has chosen to see their result.
 */
export async function refreshEscalations(user: User, extra: { medicalAdviceRequested?: boolean } = {}): Promise<Escalation[]> {
  const [profile, own, attempts, existing] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    getOwnResult(user, { log: false }),
    prisma.teachBackAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.escalation.findMany({ where: { userId: user.id } }),
  ]);

  const fired = evaluateEscalation(
    emptyContext({
      ownVariants: own.status === "ok" ? own.result.variants : [],
      // Shared genes are known to the server only if the person chose to tell their counsellor
      // (Blind Couple Match runs on the devices; see lib/actions/psi.ts).
      coupleSharedGenes: existing.find((x) => x.code === "shared_pathogenic_gene")?.detail?.split(",").filter(Boolean) ?? [],
      pregnancyStatus: profile?.pregnancyStatus ?? "prefer_not_to_say",
      teachBackAttempts: attempts,
      medicalAdviceRequested: extra.medicalAdviceRequested || existing.some((e) => e.code === "medical_advice_requested"),
    }),
  );

  const known = new Set(existing.map((e) => e.code));
  for (const e of fired) {
    await prisma.escalation.upsert({
      where: { userId_code: { userId: user.id, code: e.code } },
      create: { userId: user.id, code: e.code, severity: e.severity, detail: e.detail ?? null },
      update: { severity: e.severity, detail: e.detail ?? null },
    });
    if (!known.has(e.code)) {
      await appendAudit({ actorId: "system", subjectId: user.id, action: "escalation_raised", resource: `escalation:${e.code}` });
    }
  }
  return fired;
}

/** Re evaluates both partners, e.g. after either changes a couple comparison consent. */
export async function refreshCoupleEscalations(user: User) {
  await refreshEscalations(user);
  const link = await prisma.coupleLink.findFirst({
    where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] },
    include: { partnerA: true, partnerB: true },
  });
  if (link) await refreshEscalations(link.partnerAId === user.id ? link.partnerB : link.partnerA);
}
