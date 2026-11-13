"use server";

import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { appendAudit } from "@/lib/audit/log";
import { getSession, homeFor } from "@/lib/auth/session";
import { redirect } from "@/i18n/navigation";
import { headers } from "next/headers";
import { resetDemo } from "@/lib/demo/seed";
import { passcodeMatches, resetPolicy, type ResetPolicy } from "@/lib/demo/policy";
import { clientIp, consume, HOUR, visitorKey } from "@/lib/ratelimit";

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

/** Tells the Judge Tour whether to show the reset button, a passcode field, or nothing. */
export async function getResetPolicy(): Promise<ResetPolicy> {
  return resetPolicy();
}

/**
 * Resets the demo data. On a public deployment this needs the admin passcode (DEMO_ADMIN_PASSCODE),
 * and wrong guesses are limited to 5 an hour per visitor.
 */
export async function resetDemoAction(passcode = ""): Promise<{ ok: false; reason: "wrong_passcode" | "too_many" | "disabled" }> {
  const e = env();
  const policy = resetPolicy();
  if (policy === "disabled" || e.DEMO_MODE !== "true" || !e.LAB_SIGNING_PRIVATE_KEY) return { ok: false, reason: "disabled" };
  if (policy === "passcode") {
    const who = visitorKey(clientIp(await headers()), e.SESSION_SECRET);
    const allowance = await consume(`reset:${who}`, 5, HOUR);
    if (!allowance.allowed) return { ok: false, reason: "too_many" };
    if (!passcodeMatches(passcode)) return { ok: false, reason: "wrong_passcode" };
  }
  await resetDemo({ masterKey: e.ENCRYPTION_MASTER_KEY, labPrivateKey: e.LAB_SIGNING_PRIVATE_KEY });
  const session = await getSession();
  session.destroy();
  redirect({ href: "/login", locale: await getLocale() });
  return { ok: false, reason: "disabled" }; // unreachable: redirect throws
}
