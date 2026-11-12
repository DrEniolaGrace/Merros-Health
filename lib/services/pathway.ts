import "server-only";
import { prisma } from "@/lib/db";
import type { PathwayStep } from "@/lib/pathway/steps";
import { FUNNEL_STEPS, type FunnelStep } from "@/lib/signals/events";
import { recordSignal } from "./signals";

/** Records a pathway step once (first time wins, so time per step stays meaningful). */
export async function recordStep(userId: string, step: PathwayStep) {
  const existed = await prisma.pathwayEvent.findUnique({ where: { userId_step: { userId, step } } });
  if (existed) return;
  await prisma.pathwayEvent.upsert({
    where: { userId_step: { userId, step } },
    create: { userId, step },
    update: {},
  });
  // The same step also becomes one anonymous event for the programme (only with consent).
  if ((FUNNEL_STEPS as readonly string[]).includes(step)) await recordSignal(userId, step as FunnelStep);
}
