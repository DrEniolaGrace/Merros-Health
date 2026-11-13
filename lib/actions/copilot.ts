"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { env } from "@/lib/env";
import { clientIp, consume, DAY, HOUR, positiveInt, visitorKey } from "@/lib/ratelimit";
import { rateLimitedReply } from "@/lib/ai/limits";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { appendAudit } from "@/lib/audit/log";
import { recordSignal } from "@/lib/services/signals";
import { getOwnResult } from "@/lib/services/results";
import { MAX_QUESTION_CHARS, runCopilot } from "@/lib/ai/copilot";
import { getProvider } from "@/lib/ai/provider";
import type { CopilotContext, CopilotReply } from "@/lib/ai/types";
import { conditionById } from "@/content/conditions";

const input = z.object({
  question: z.string().min(1).max(MAX_QUESTION_CHARS),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) })).max(12),
});

const SEVERITY: Record<string, string> = { high_distress: "urgent", medical_advice_requested: "routine", safety_verifier_block: "routine" };

/**
 * One Copilot turn. The model context is de-identified: language, reading level and gene level
 * findings only. Conversation text is not stored; only which guard rule fired is logged.
 */
export async function askCopilot(raw: z.infer<typeof input>): Promise<CopilotReply> {
  const user = await requireUser(["patient"]);
  const { question, history } = input.parse(raw);
  const locale = (await getLocale()) === "ar" ? "ar" : "en";

  // Public demo: cap questions per visitor per hour and across the whole site per day, so the
  // model budget cannot be used up. The limit is checked before anything is sent to a model.
  const provider = getProvider();
  const who = visitorKey(clientIp(await headers()), env().SESSION_SECRET);
  const perVisitor = await consume(`copilot:${who}`, positiveInt(process.env.COPILOT_RATE_PER_HOUR, 20), HOUR);
  const perDay = perVisitor.allowed ? await consume("copilot:all", positiveInt(process.env.COPILOT_DAILY_CAP, 1500), DAY) : null;
  if (!perVisitor.allowed || (perDay && !perDay.allowed)) return rateLimitedReply(locale, perVisitor.allowed ? "site" : "visitor", provider.name);

  const own = await getOwnResult(user, { log: false });
  const ctx: CopilotContext = {
    locale,
    level: user.profile?.readingLevel ?? "standard",
    ownFindings:
      own.status === "ok"
        ? own.result.variants.map((v) => ({ gene: v.gene, classification: v.acmg, condition: conditionById(v.conditionId)?.name.en ?? v.conditionId }))
        : null,
  };

  const reply = await runCopilot(question, history, ctx, provider);

  await appendAudit({ actorId: user.id, subjectId: user.id, action: "copilot_question", resource: `copilot:${reply.label}` });
  await recordSignal(user.id, "copilot_question");
  if (reply.guard.length) {
    await recordSignal(user.id, "copilot_blocked");
    await prisma.guardEvent.createMany({ data: reply.guard.map((g) => ({ stage: g.stage, rule: g.rule.slice(0, 120), action: g.action, locale })) });
  }
  for (const code of reply.escalations) {
    const existed = await prisma.escalation.findUnique({ where: { userId_code: { userId: user.id, code } } });
    await prisma.escalation.upsert({
      where: { userId_code: { userId: user.id, code } },
      create: { userId: user.id, code, severity: SEVERITY[code] ?? "routine" },
      update: existed?.status === "resolved" ? { status: "open" } : {},
    });
    if (!existed) await appendAudit({ actorId: "system", subjectId: user.id, action: "escalation_raised", resource: `escalation:${code}` });
  }
  return reply;
}
