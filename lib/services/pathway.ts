import "server-only";
import { prisma } from "@/lib/db";
import type { PathwayStep } from "@/lib/pathway/steps";

/** Records a pathway step once (first time wins, so time per step stays meaningful). */
export async function recordStep(userId: string, step: PathwayStep) {
  await prisma.pathwayEvent.upsert({
    where: { userId_step: { userId, step } },
    create: { userId, step },
    update: {},
  });
}
