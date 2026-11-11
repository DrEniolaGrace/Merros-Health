"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { RELATIONS } from "@/lib/family/engine";

const relative = z.object({
  relation: z.enum(RELATIONS),
  side: z.enum(["maternal", "paternal", "unknown", "na"]),
  planning: z.boolean(),
  tested: z.enum(["carrier", "not_carrier", "unknown"]),
});

const MAX_RELATIVES = 40;

/** Adds a relative by relationship label only. No name is ever asked for or stored. */
export async function addRelative(input: z.infer<typeof relative>) {
  const user = await requireUser(["patient"]);
  const data = relative.parse(input);
  if ((await prisma.pedigreeNode.count({ where: { userId: user.id } })) >= MAX_RELATIVES) throw new Error("Too many relatives");
  await prisma.pedigreeNode.create({ data: { userId: user.id, ...data } });
  revalidatePath("/[locale]/family", "page");
}

export async function removeRelative(id: string) {
  const user = await requireUser(["patient"]);
  await prisma.pedigreeNode.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/[locale]/family", "page");
}

/**
 * Creates a private invitation link. The link carries a random token only: it does not name the
 * sender, the gene, or the relationship, and the page it opens reveals none of them.
 */
export async function createInvite(): Promise<{ token: string }> {
  const user = await requireUser(["patient"]);
  const token = randomBytes(18).toString("base64url");
  await prisma.relativeInvite.create({ data: { token, userId: user.id } });
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "relative_invited", resource: "invite" });
  revalidatePath("/[locale]/family", "page");
  return { token };
}
