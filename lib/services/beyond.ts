import "server-only";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit/log";
import { hasActiveConsent, type ConsentLike } from "@/lib/consent/check";
import { features } from "@/lib/features";
import { assess, RELATIONSHIPS, type BeyondPanelResult, type Relationship, type Segment } from "@/lib/beyond/engine";
import dataset from "@/data/reference/beyond-panel.json";

/**
 * Risk Beyond the Panel (SPEC 6.2). With the genomics service unavailable (FEATURE_BEYOND_PANEL
 * = precomputed), shared segment data for the demo couples comes from a synthetic file; the
 * numbers are still computed here by the tested engine. Results always go to the counsellor
 * first, and only with a separate consent from BOTH partners.
 */
const COUPLES = (dataset as { couples: Record<string, { declared: string; shared: Segment[] }> }).couples;

export const datasetKey = (a: string | null, b: string | null) => (a && b ? [a, b].sort().join("-") : null);

export function precomputedFor(key: string | null): { declared: Relationship; shared: Segment[] } | null {
  const c = key ? COUPLES[key] : undefined;
  if (!c || !(RELATIONSHIPS as readonly string[]).includes(c.declared)) return null;
  return { declared: c.declared as Relationship, shared: c.shared };
}

async function coupleOf(userId: string) {
  return prisma.coupleLink.findFirst({
    where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] },
    include: { partnerA: { include: { consents: true } }, partnerB: { include: { consents: true } }, rohAnalysis: true },
  });
}

export type BeyondState =
  | { state: "no_partner" }
  | { state: "unavailable"; selfConsented: boolean } // no whole genome data for this couple
  | { state: "needs_consent"; selfConsented: boolean; partnerConsented: boolean }
  | { state: "with_counsellor" }
  | { state: "released"; result: BeyondPanelResult };

/** What the person may see. The estimate itself is only included once a counsellor released it. */
export async function beyondStateFor(user: User): Promise<BeyondState> {
  const link = await coupleOf(user.id);
  if (!link) return { state: "no_partner" };
  const me = link.partnerAId === user.id ? link.partnerA : link.partnerB;
  const partner = link.partnerAId === user.id ? link.partnerB : link.partnerA;
  const selfConsented = hasActiveConsent(me.consents, "beyond_panel");
  const data = precomputedFor(datasetKey(link.partnerA.personaKey, link.partnerB.personaKey));
  if (!data) return { state: "unavailable", selfConsented };
  const both = selfConsented && hasActiveConsent(partner.consents, "beyond_panel");
  if (!both || !link.rohAnalysis) return { state: "needs_consent", selfConsented, partnerConsented: hasActiveConsent(partner.consents, "beyond_panel") };
  if (link.rohAnalysis.status !== "released") return { state: "with_counsellor" };
  return { state: "released", result: assess(data.declared, data.shared) };
}

/**
 * Keeps the analysis in step with consent. Both partners agreed and data exists: the analysis is
 * created and held for the counsellor. Either withdraws: it is deleted, released or not.
 * Returns true when an analysis exists afterwards.
 */
export async function syncBeyondPanel(userId: string): Promise<boolean> {
  const link = await coupleOf(userId);
  if (!link) return false;
  const both = hasActiveConsent(link.partnerA.consents, "beyond_panel") && hasActiveConsent(link.partnerB.consents, "beyond_panel");
  const data = precomputedFor(datasetKey(link.partnerA.personaKey, link.partnerB.personaKey));
  if (!both || !data) {
    if (link.rohAnalysis) {
      await prisma.rohAnalysis.delete({ where: { id: link.rohAnalysis.id } });
      await prisma.escalation.deleteMany({ where: { userId: { in: [link.partnerAId, link.partnerBId] }, code: "risk_beyond_panel_result" } });
      for (const id of [link.partnerAId, link.partnerBId]) await appendAudit({ actorId: userId, subjectId: id, action: "beyond_panel_withdrawn", resource: "roh_analysis" });
    }
    return false;
  }
  if (!link.rohAnalysis) {
    await prisma.rohAnalysis.create({ data: { coupleLinkId: link.id, source: features().beyondPanel } });
    for (const id of [link.partnerAId, link.partnerBId]) {
      // SPEC 4.8: any Risk Beyond the Panel result routes to a human counsellor.
      await prisma.escalation.upsert({
        where: { userId_code: { userId: id, code: "risk_beyond_panel_result" } },
        create: { userId: id, code: "risk_beyond_panel_result", severity: "high" },
        update: { status: "open" },
      });
      await appendAudit({ actorId: "system", subjectId: id, action: "beyond_panel_ready", resource: "roh_analysis" });
    }
  }
  return true;
}

/** Counsellor view. Needs the beyond_panel consent of the patient whose case is open. */
export async function beyondForCounsellor(counsellorId: string, patient: { id: string; consents: ConsentLike[] }) {
  if (!hasActiveConsent(patient.consents, "beyond_panel")) return null;
  const link = await coupleOf(patient.id);
  if (!link?.rohAnalysis) return null;
  const data = precomputedFor(datasetKey(link.partnerA.personaKey, link.partnerB.personaKey));
  if (!data) return null;
  await appendAudit({ actorId: counsellorId, subjectId: patient.id, action: "beyond_panel_viewed", resource: "roh_analysis" });
  return { id: link.rohAnalysis.id, status: link.rohAnalysis.status, source: link.rohAnalysis.source, result: assess(data.declared, data.shared) };
}

/** The counsellor has discussed it with the couple and releases the summary to both of them. */
export async function releaseBeyond(analysisId: string, counsellorId: string) {
  const a = await prisma.rohAnalysis.findUnique({ where: { id: analysisId }, include: { coupleLink: true } });
  if (!a) throw new Error("Analysis not found");
  if (a.status === "released") return;
  await prisma.rohAnalysis.update({ where: { id: a.id }, data: { status: "released", releasedAt: new Date(), releasedById: counsellorId } });
  for (const id of [a.coupleLink.partnerAId, a.coupleLink.partnerBId]) {
    await prisma.escalation.updateMany({ where: { userId: id, code: "risk_beyond_panel_result" }, data: { status: "resolved" } });
    await appendAudit({ actorId: counsellorId, subjectId: id, action: "beyond_panel_released", resource: "roh_analysis" });
  }
}
