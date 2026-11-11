/**
 * Living Results service (SPEC 6.3). Free of Next.js imports so the scheduled job
 * (`pnpm variant-watch`) can run it; keys are passed in.
 *
 * When a classification changes:
 *   1. a ReclassificationEvent is recorded (no personal data)
 *   2. everyone affected is counted (for the health system, without identities)
 *   3. for people who consented to be recontacted: the lab's amended signed report is stored
 *      UNRELEASED, a counsellor task is created, and an escalation waits for the counsellor
 *   4. the person sees nothing until the counsellor has spoken to them and releases it.
 * People who did not consent are never contacted (the right not to know).
 */
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canonicalize } from "@/lib/canonical";
import { decryptString, encryptString, unwrapDataKey } from "@/lib/crypto/fieldEncryption";
import { buildBundle, parseBundle } from "@/lib/fhir/bundle";
import { keyFingerprint, publicKeyFromPrivate, signBundle, verifyBundle } from "@/lib/fhir/sign";
import { hasActiveConsent } from "@/lib/consent/check";
import { appendAudit } from "@/lib/audit/log";
import { amend, changesFor, normaliseClinvarClass, type FeedEntry } from "./watch";

export interface LivingKeys {
  masterKey: string;
  /** Demo only: lets the prototype play the lab issuing an amended signed report. */
  labPrivateKey: string;
}

async function latestReleased(user: User, keys: LivingKeys) {
  const row = await prisma.labResult.findFirst({ where: { userId: user.id, releasedAt: { not: null } }, orderBy: { importedAt: "desc" } });
  if (!row) return null;
  const dek = unwrapDataKey(user.wrappedDataKey, keys.masterKey);
  const bundle = JSON.parse(decryptString(row.encBundle, dek, user.id));
  if (!verifyBundle(bundle, row.signature, publicKeyFromPrivate(keys.labPrivateKey))) return null;
  return { row, dek, parsed: parseBundle(bundle) };
}

export async function applyReclassification(entry: FeedEntry, keys: LivingKeys) {
  const users = await prisma.user.findMany({ where: { role: "patient" }, include: { consents: true } });
  let affected = 0;
  let tasks = 0;
  let event = await prisma.reclassificationEvent.findUnique({ where: { clinvarId_newClass: { clinvarId: entry.clinvarId, newClass: entry.classification } } });

  for (const user of users) {
    const current = await latestReleased(user, keys);
    if (!current) continue;
    const [change] = changesFor(current.parsed.variants, [entry]);
    if (!change) continue;
    affected++;
    event ??= await prisma.reclassificationEvent.create({
      data: { clinvarId: entry.clinvarId, gene: entry.gene, hgvs: entry.hgvs, oldClass: change.oldClass, newClass: change.newClass, source: entry.source, evidence: entry.evidence },
    });
    if (!hasActiveConsent(user.consents, "reclassification_recontact")) continue; // right not to know
    if (await prisma.counsellorTask.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } })) continue;

    // The lab's amended, signed report. Stored unreleased until the counsellor has told the person.
    const n = (await prisma.labResult.count({ where: { userId: user.id } })) + 0;
    const accession = `${current.parsed.accession.replace(/-R\d+$/, "")}-R${n}`;
    const bundle = buildBundle(
      { accession, labName: current.parsed.labName, issued: new Date().toISOString(), panelGenes: current.parsed.panelGenes },
      amend(current.parsed.variants, change),
    );
    const signature = signBundle(bundle, keys.labPrivateKey);
    await prisma.labResult.create({
      data: {
        userId: user.id,
        accession,
        labKeyId: keyFingerprint(publicKeyFromPrivate(keys.labPrivateKey)),
        signature,
        encBundle: encryptString(canonicalize(bundle), current.dek, user.id),
        verifiedAt: new Date(),
        releasedAt: null,
      },
    });
    await prisma.counsellorTask.create({ data: { userId: user.id, eventId: event.id } });
    await prisma.escalation.upsert({
      where: { userId_code: { userId: user.id, code: "variant_reclassified" } },
      create: { userId: user.id, code: "variant_reclassified", severity: "high", detail: entry.gene, status: "pending_counsellor" },
      update: { status: "pending_counsellor", detail: entry.gene },
    });
    await appendAudit({ actorId: "system", subjectId: user.id, action: "reclassification_detected", resource: `clinvar:${entry.clinvarId}` });
    tasks++;
  }
  if (event) await prisma.reclassificationEvent.update({ where: { id: event.id }, data: { affected: Math.max(event.affected, affected) } });
  return { eventId: event?.id ?? null, affected, tasks };
}

/** The counsellor confirms they have told the person; the amended result becomes visible. */
export async function releaseTask(taskId: string, counsellorUserId: string) {
  const task = await prisma.counsellorTask.findUnique({ where: { id: taskId } });
  if (!task || task.status === "released") return false;
  const now = new Date();
  await prisma.$transaction([
    prisma.counsellorTask.update({ where: { id: taskId }, data: { status: "released", releasedAt: now } }),
    prisma.labResult.updateMany({ where: { userId: task.userId, releasedAt: null }, data: { releasedAt: now } }),
    prisma.escalation.updateMany({ where: { userId: task.userId, code: "variant_reclassified" }, data: { status: "open" } }),
    // Carrier status may have changed, so any couple match must be run again by the couple.
    prisma.psiSession.deleteMany({ where: { coupleLink: { OR: [{ partnerAId: task.userId }, { partnerBId: task.userId }] } } }),
  ]);
  await appendAudit({ actorId: counsellorUserId, subjectId: task.userId, action: "reclassification_released", resource: `task:${taskId}` });
  return true;
}

/** Distinct ClinVar ids across all released results (for the scheduled ClinVar check). */
export async function watchedVariants(keys: LivingKeys) {
  const users = await prisma.user.findMany({ where: { role: "patient" } });
  const seen = new Map<string, { clinvarId: string; gene: string; hgvs: string; acmg: string }>();
  for (const u of users) {
    const cur = await latestReleased(u, keys);
    for (const v of cur?.parsed.variants ?? []) if (v.clinvarId) seen.set(v.clinvarId, { clinvarId: v.clinvarId, gene: v.gene, hgvs: v.hgvs, acmg: v.acmg });
  }
  return [...seen.values()];
}

/**
 * VariantWatch: asks ClinVar (NCBI E-utilities) for the current classification of every watched
 * variant and applies any change. Network errors are reported, never thrown.
 */
export async function runVariantWatch(keys: LivingKeys, opts: { apiKey?: string; fetchImpl?: typeof fetch } = {}) {
  const watched = await watchedVariants(keys);
  if (!watched.length) return { checked: 0, changed: 0, error: null as string | null };
  const f = opts.fetchImpl ?? fetch;
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&retmode=json&id=${watched.map((w) => w.clinvarId).join(",")}${opts.apiKey ? `&api_key=${opts.apiKey}` : ""}`;
  let result: Record<string, { germline_classification?: { description?: string; review_status?: string } }>;
  try {
    const res = await f(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return { checked: 0, changed: 0, error: `ClinVar responded ${res.status}` };
    result = (await res.json()).result ?? {};
  } catch (e) {
    return { checked: 0, changed: 0, error: `ClinVar not reachable: ${(e as Error).message}` };
  }
  let changed = 0;
  for (const w of watched) {
    const cls = normaliseClinvarClass(result[w.clinvarId]?.germline_classification?.description);
    if (!cls || cls === w.acmg) continue;
    const r = await applyReclassification(
      { clinvarId: w.clinvarId, gene: w.gene, hgvs: w.hgvs, classification: cls, source: "clinvar", evidence: `ClinVar now lists this variant as ${result[w.clinvarId]?.germline_classification?.description} (${result[w.clinvarId]?.germline_classification?.review_status ?? "review status not given"}).` },
      keys,
    );
    if (r.affected) changed++;
  }
  return { checked: watched.length, changed, error: null as string | null };
}
