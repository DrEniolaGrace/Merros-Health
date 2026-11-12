/**
 * Database side of the Population Signals Dashboard. Free of "server-only" so the CLI seed can use it.
 */
import { prisma } from "@/lib/db";
import { budgetPeriod, canSpend, seededRng, type Rng } from "./dp";
import { computeRelease, PERIOD_BUDGET, type ReleaseData } from "./release";
import { generateJourneys } from "./synthetic";
import type { SignalEvent } from "./events";

export interface BudgetStatus {
  period: string;
  budget: number;
  spent: number;
  remaining: number;
  releases: number;
}

export async function budgetStatus(now: Date): Promise<BudgetStatus> {
  const period = budgetPeriod(now);
  const [agg, releases] = await Promise.all([
    prisma.privacyBudgetLedger.aggregate({ where: { period }, _sum: { epsilon: true } }),
    prisma.signalRelease.count({ where: { period } }),
  ]);
  const spent = Math.round((agg._sum.epsilon ?? 0) * 1e6) / 1e6;
  return { period, budget: PERIOD_BUDGET, spent, remaining: Math.max(0, Math.round((PERIOD_BUDGET - spent) * 1e6) / 1e6), releases };
}

export type PublishResult = { ok: true; id: string; epsilon: number } | { ok: false; reason: "budget_exhausted" };

/**
 * Publishes a new release, or refuses if the period budget cannot pay for it. The check and the
 * ledger write happen in one serialised transaction, so two publishers cannot overspend together.
 */
export async function publishRelease(now: Date, rng: Rng): Promise<PublishResult> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7203)`;
      const period = budgetPeriod(now);
      const agg = await tx.privacyBudgetLedger.aggregate({ where: { period }, _sum: { epsilon: true } });
      const rows = await tx.aggregateEvent.findMany({ select: { journey: true, kind: true, region: true, language: true, readingLevel: true, value: true, at: true } });
      const { data, ledger, epsilon } = computeRelease(rows as SignalEvent[], now, rng);
      if (!canSpend(agg._sum.epsilon ?? 0, epsilon, PERIOD_BUDGET)) return { ok: false as const, reason: "budget_exhausted" as const };
      const release = await tx.signalRelease.create({ data: { period, epsilon, data: data as object, createdAt: now } });
      await tx.privacyBudgetLedger.createMany({ data: ledger.map((l) => ({ ...l, releaseId: release.id, period, at: now })) });
      return { ok: true as const, id: release.id, epsilon };
    },
    { timeout: 30_000 },
  );
}

export async function latestRelease(): Promise<{ id: string; createdAt: Date; epsilon: number; data: ReleaseData } | null> {
  const r = await prisma.signalRelease.findFirst({ orderBy: { createdAt: "desc" } });
  return r ? { id: r.id, createdAt: r.createdAt, epsilon: r.epsilon, data: r.data as unknown as ReleaseData } : null;
}

/** Demo reset: reload the synthetic journeys and publish the first release of the period. */
export async function seedSignals(now: Date) {
  await prisma.$transaction([prisma.privacyBudgetLedger.deleteMany(), prisma.signalRelease.deleteMany(), prisma.aggregateEvent.deleteMany()]);
  const events = generateJourneys(now);
  for (let i = 0; i < events.length; i += 4000) {
    await prisma.aggregateEvent.createMany({ data: events.slice(i, i + 4000).map((e) => ({ ...e, synthetic: true })) });
  }
  // The demo release uses a fixed seed so the walkthrough is repeatable. Real releases use the secure generator.
  await publishRelease(now, seededRng(42));
  return events.length;
}
