"use server";

import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { appendAudit } from "@/lib/audit/log";
import { getSession, homeFor } from "@/lib/auth/session";
import { redirect } from "@/i18n/navigation";
import { resetDemo } from "@/lib/demo/seed";

async function signIn(personaKey: string) {
  if (env().DEMO_MODE !== "true") throw new Error("Persona login is only available in demo mode");
  const user = await prisma.user.findUnique({ where: { personaKey }, include: { profile: true } });
  if (!user) throw new Error("Unknown persona");
  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  await session.save();
  await appendAudit({ actorId: user.id, subjectId: user.id, action: "login", resource: "session" });
  return user;
}

export async function loginAs(personaKey: string) {
  const user = await signIn(personaKey);
  const locale = await getLocale();
  const target = user.role === "patient" && !user.profile?.onboardedAt ? "/onboarding" : homeFor(user.role);
  redirect({ href: target, locale });
}

export async function signOut() {
  const session = await getSession();
  session.destroy();
  redirect({ href: "/login", locale: await getLocale() });
}

/** Judge Tour: switch persona and open a screen. Only fixed, known paths are allowed. */
const TOUR_PATHS = new Set(["/onboarding", "/import", "/copilot", "/family", "/find-care", "/couple", "/teach-back", "/options", "/support", "/counsellor", "/privacy", "/result", "/home"]);

export async function tourGo(personaKey: string, path: string) {
  if (!TOUR_PATHS.has(path)) throw new Error("Unknown tour path");
  await signIn(personaKey);
  redirect({ href: path, locale: await getLocale() });
}

export async function resetDemoAction() {
  const e = env();
  if (e.DEMO_MODE !== "true" || !e.LAB_SIGNING_PRIVATE_KEY) throw new Error("Demo reset unavailable");
  await resetDemo({ masterKey: e.ENCRYPTION_MASTER_KEY, labPrivateKey: e.LAB_SIGNING_PRIVATE_KEY });
  const session = await getSession();
  session.destroy();
  redirect({ href: "/login", locale: await getLocale() });
}
