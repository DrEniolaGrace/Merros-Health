import "server-only";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import type { Role, User, Profile } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export interface SessionData {
  userId?: string;
  role?: Role;
}

/**
 * Demo authentication: a persona picker (no passwords) behind DEMO_MODE.
 * Production integration point is UAE Pass (OpenID Connect); see docs/ARCHITECTURE.md.
 */
/**
 * The session cookie requires HTTPS in production. Local Docker sets COOKIE_SECURE=false so the demo can be
 * opened from a phone on the same Wi-Fi over plain http. Never set that on a deployed environment.
 */
const SECURE_COOKIE = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), {
    password: env().SESSION_SECRET,
    cookieName: "merros-session",
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: SECURE_COOKIE, path: "/" },
    ttl: 60 * 60 * 8,
  });
}

export type CurrentUser = User & { profile: Profile | null };

export async function currentUser(): Promise<CurrentUser | null> {
  const s = await getSession();
  if (!s.userId) return null;
  return prisma.user.findUnique({ where: { id: s.userId }, include: { profile: true } });
}

/** Redirects to the persona picker when signed out, or home when the role does not match. */
export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) redirect({ href: "/login", locale });
  if (roles && !roles.includes(user!.role)) redirect({ href: homeFor(user!.role), locale });
  return user!;
}

export function homeFor(role: Role): string {
  return role === "counsellor" ? "/counsellor" : role === "admin" ? "/admin" : "/home";
}
