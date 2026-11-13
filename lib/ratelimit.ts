/**
 * Small fixed window rate limiter stored in Postgres, so it works on serverless hosting where
 * memory is not shared between requests. Free of "server-only" so jobs and tests can use it.
 */
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";

export function windowStart(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/** Visitors are identified by a keyed hash of their network address; the address itself is never stored. */
export function visitorKey(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(`visitor:${ip.trim().toLowerCase()}`).digest("hex").slice(0, 32);
}

/** First address in X-Forwarded-For (set by the hosting platform), else X-Real-IP, else "unknown". */
export function clientIp(headers: { get(name: string): string | null }): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip")?.trim() || "unknown";
}

export interface Allowance {
  allowed: boolean;
  remaining: number;
  /** When the current window ends. */
  resetAt: Date;
}

/** Counts one use of `key`. Atomic: concurrent requests cannot slip past the limit together. */
export async function consume(key: string, limit: number, windowMs: number, now = new Date()): Promise<Allowance> {
  const window = windowStart(now, windowMs);
  const row = await prisma.rateLimit.upsert({
    where: { key_window: { key, window } },
    create: { key, window, count: 1 },
    update: { count: { increment: 1 } },
  });
  return { allowed: row.count <= limit, remaining: Math.max(0, limit - row.count), resetAt: new Date(window.getTime() + windowMs) };
}

/** Removes windows that ended more than a day ago. Run by the nightly job. */
export async function pruneRateLimits(now = new Date()) {
  return prisma.rateLimit.deleteMany({ where: { window: { lt: new Date(now.getTime() - 2 * 86_400_000) } } });
}

export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
