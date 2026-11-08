/**
 * Demo data reset. Used by `pnpm seed` and by the Judge Tour "Reset demo" action.
 * Everything created here is synthetic. Deliberately free of "server-only" imports so the CLI
 * seed (tsx) can run it; keys are passed in explicitly.
 */
import { prisma } from "@/lib/db";
import { canonicalize } from "@/lib/canonical";
import { encryptString, generateDataKey, wrapDataKey } from "@/lib/crypto/fieldEncryption";
import { buildBundle } from "@/lib/fhir/bundle";
import { keyFingerprint, publicKeyFromPrivate, signBundle } from "@/lib/fhir/sign";
import { analyseCouple } from "@/lib/risk/engine";
import { emptyContext, evaluateEscalation } from "@/lib/escalation/rules";
import { PURPOSES } from "@/lib/consent/purposes";
import { appendAudit } from "@/lib/audit/log";
import { COUNSELLOR, LAB_NAME, PANEL_GENES, PERSONAS, type Persona } from "@/content/personas";

export interface SeedKeys {
  masterKey: string;
  labPrivateKey: string;
}

const DAY = 86_400_000;

/** Consents an already onboarded persona has given. Nothing is assumed beyond what the story needs. */
function seededConsents(p: Persona): string[] {
  if (p.role !== "patient" || !p.onboarded) return [];
  const c = ["view_own_result", "aggregate_analytics"];
  if (p.partnerKey) c.push("couple_comparison");
  if (p.key === "hamad") c.push("counsellor_access", "reclassification_recontact");
  if (p.key === "sara") c.push("counsellor_access");
  return c;
}

export function accessionFor(key: string) {
  return `SADL-2026-${key.toUpperCase()}`;
}

export async function resetDemo(keys: SeedKeys) {
  const labPub = publicKeyFromPrivate(keys.labPrivateKey);

  // Wipe demo data (synthetic only). The audit chain restarts at genesis with a demo_reset entry.
  await prisma.$transaction([
    prisma.accessLog.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.clinician.deleteMany(),
    prisma.labInbox.deleteMany(),
    prisma.coupleLink.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const ids = new Map<string, string>();
  for (const p of PERSONAS) {
    const dek = generateDataKey();
    const user = await prisma.user.create({
      data: {
        personaKey: p.key,
        role: p.role,
        displayNameEn: p.nameEn,
        displayNameAr: p.nameAr,
        wrappedDataKey: wrapDataKey(dek, keys.masterKey),
        labAccession: p.variants ? accessionFor(p.key) : null,
        profile: {
          create: {
            locale: p.locale,
            readingLevel: p.readingLevel,
            mediaPref: p.mediaPref,
            pregnancyStatus: p.pregnancyStatus,
            onboardedAt: p.onboarded ? new Date(Date.now() - 3 * DAY) : null,
            presentationSeed: Math.floor(Math.random() * 1_000_000),
          },
        },
      },
    });
    ids.set(p.key, user.id);

    for (const purpose of seededConsents(p)) {
      const def = PURPOSES.find((d) => d.purpose === purpose)!;
      await prisma.consent.create({
        data: {
          userId: user.id,
          purpose,
          scope: def.scope,
          recipient: def.recipient,
          grantedAt: new Date(Date.now() - 3 * DAY),
          expiresAt: def.defaultDays ? new Date(Date.now() + def.defaultDays * DAY) : null,
        },
      });
    }

    if (p.variants) {
      const accession = accessionFor(p.key);
      const bundle = buildBundle(
        { accession, labName: LAB_NAME, issued: "2026-11-01T09:00:00Z", panelGenes: PANEL_GENES },
        p.variants,
      );
      const signature = signBundle(bundle, keys.labPrivateKey);
      if (p.onboarded) {
        await prisma.labResult.create({
          data: {
            userId: user.id,
            accession,
            labKeyId: keyFingerprint(labPub),
            signature,
            encBundle: encryptString(canonicalize(bundle), dek, user.id),
            verifiedAt: new Date(Date.now() - 3 * DAY),
            importedAt: new Date(Date.now() - 3 * DAY),
          },
        });
        await prisma.pathwayEvent.create({ data: { userId: user.id, step: "result_received", at: new Date(Date.now() - 3 * DAY) } });
      } else {
        await prisma.labInbox.create({
          data: { accession, encPayload: encryptString(JSON.stringify({ bundle, signature }), keys.masterKey, "lab-inbox") },
        });
      }
    }
  }

  // Couples (each pair once).
  const seen = new Set<string>();
  for (const p of PERSONAS) {
    if (!p.partnerKey || seen.has(p.partnerKey)) continue;
    seen.add(p.key);
    await prisma.coupleLink.create({
      data: { partnerAId: ids.get(p.key)!, partnerBId: ids.get(p.partnerKey)!, status: p.coupleStatus ?? "engaged" },
    });
  }

  // Counsellor directory entry linked to Dr. Layla's account.
  await prisma.clinician.create({ data: { ...COUNSELLOR, userId: ids.get("layla")! } });

  // Pre existing escalations for already onboarded personas, from the same tested rules.
  for (const p of PERSONAS) {
    if (p.role !== "patient" || !p.onboarded) continue;
    const partner = p.partnerKey ? PERSONAS.find((x) => x.key === p.partnerKey) : undefined;
    const bothShare = partner?.onboarded && partner.variants && p.variants;
    const shared = bothShare ? analyseCouple(p.variants!, partner!.variants!).sharedGenes : [];
    const fired = evaluateEscalation(
      emptyContext({ ownVariants: p.variants ?? [], coupleSharedGenes: shared, pregnancyStatus: p.pregnancyStatus }),
    );
    for (const e of fired) {
      await prisma.escalation.create({
        data: { userId: ids.get(p.key)!, code: e.code, severity: e.severity, detail: e.detail ?? null, createdAt: new Date(Date.now() - 2 * DAY) },
      });
    }
  }

  await appendAudit({ actorId: "system", subjectId: "-", action: "demo_reset", resource: "demo" });
  return { users: ids.size };
}
