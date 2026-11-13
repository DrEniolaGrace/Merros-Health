import { describe, expect, it } from "vitest";
import { assertSafeDatabase, databaseHost, isSafeDatabase } from "@/lib/db/guard";
import { cronAuthorised, passcodeMatches, resetPolicy } from "@/lib/demo/policy";
import { features } from "@/lib/features";
import { clientIp, positiveInt, visitorKey, windowStart, HOUR } from "@/lib/ratelimit";
import { rateLimitedReply } from "@/lib/ai/limits";

const DEV = "ep-dev-branch.c-8.eu-central-1.aws.neon.tech";
const PROD = "ep-prod-branch.c-8.eu-central-1.aws.neon.tech";
const url = (host: string) => `postgresql://user:secret@${host}/neondb?sslmode=require`;

describe("database guard: tests and seeds never touch production", () => {
  it("allows the local Docker database", () => {
    expect(isSafeDatabase({ DATABASE_URL: "postgresql://meros:meros@localhost:5432/meros", DIRECT_URL: "postgresql://meros:meros@localhost:5432/meros" })).toBe(true);
    expect(isSafeDatabase({ DATABASE_URL: "postgresql://meros:meros@postgres:5432/meros" })).toBe(true);
  });

  it("allows the dev branch, pooled or direct, when it is listed", () => {
    const env = { SAFE_DATABASE_HOSTS: DEV, DATABASE_URL: url(DEV.replace(".c-8", "-pooler.c-8")), DIRECT_URL: url(DEV) };
    expect(isSafeDatabase(env)).toBe(true);
  });

  it("refuses the production branch", () => {
    const env = { SAFE_DATABASE_HOSTS: DEV, DATABASE_URL: url(PROD.replace(".c-8", "-pooler.c-8")), DIRECT_URL: url(PROD) };
    expect(isSafeDatabase(env)).toBe(false);
    expect(() => assertSafeDatabase("the unit tests", env)).toThrow(/Refusing to run the unit tests/);
  });

  it("refuses when only one of the two URLs is safe", () => {
    expect(isSafeDatabase({ SAFE_DATABASE_HOSTS: DEV, DATABASE_URL: url(DEV), DIRECT_URL: url(PROD) })).toBe(false);
  });

  it("refuses an unknown host, a missing URL and a malformed URL", () => {
    expect(isSafeDatabase({ DATABASE_URL: url("db.example.com") })).toBe(false);
    expect(isSafeDatabase({})).toBe(false);
    expect(isSafeDatabase({ DATABASE_URL: "not a url" })).toBe(false);
  });

  it("never prints credentials in its error", () => {
    try {
      assertSafeDatabase("the demo seed", { DATABASE_URL: url(PROD) });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain(PROD);
      expect((e as Error).message).not.toContain("secret");
    }
    expect(databaseHost(url(PROD))).toBe(PROD);
  });
});

describe("demo reset policy", () => {
  it("is one click on a developer machine", () => {
    expect(resetPolicy({ DEMO_MODE: "true" })).toBe("open");
  });

  it("needs the passcode wherever one is set", () => {
    expect(resetPolicy({ DEMO_MODE: "true", DEMO_ADMIN_PASSCODE: "open-sesame", VERCEL: "1" })).toBe("passcode");
    expect(resetPolicy({ DEMO_MODE: "true", DEMO_ADMIN_PASSCODE: "open-sesame" })).toBe("passcode");
  });

  it("has no reset at all on a hosted site without a passcode, or outside demo mode", () => {
    expect(resetPolicy({ DEMO_MODE: "true", VERCEL: "1" })).toBe("disabled");
    expect(resetPolicy({ DEMO_MODE: "false", DEMO_ADMIN_PASSCODE: "x" })).toBe("disabled");
  });

  it("accepts only the exact passcode", () => {
    const env = { DEMO_ADMIN_PASSCODE: "open-sesame" };
    expect(passcodeMatches("open-sesame", env)).toBe(true);
    expect(passcodeMatches(" open-sesame ", env)).toBe(true);
    expect(passcodeMatches("open-sesam", env)).toBe(false);
    expect(passcodeMatches("", env)).toBe(false);
    expect(passcodeMatches("anything", {})).toBe(false);
  });

  it("the nightly job needs the cron secret as a Bearer token", () => {
    const env = { CRON_SECRET: "s3cret" };
    expect(cronAuthorised("Bearer s3cret", env)).toBe(true);
    expect(cronAuthorised("Bearer wrong", env)).toBe(false);
    expect(cronAuthorised("s3cret", env)).toBe(false);
    expect(cronAuthorised(null, env)).toBe(false);
    expect(cronAuthorised("Bearer ", {})).toBe(false);
  });
});

describe("feature flags", () => {
  it("default to the fallbacks that need no Azure", () => {
    expect(features({})).toEqual({ voice: "browser", videoConsult: "simulated", variantWatch: "cron", resultVideo: "player", beyondPanel: "precomputed" });
  });

  it("a flag without its key stays on the fallback", () => {
    expect(features({ FEATURE_VOICE: "azure" }).voice).toBe("browser");
    expect(features({ FEATURE_VIDEO_CONSULT: "acs" }).videoConsult).toBe("simulated");
    expect(features({ FEATURE_BEYOND_PANEL: "service" }).beyondPanel).toBe("precomputed");
  });

  it("switches to Azure with flag and key, and can be forced back", () => {
    expect(features({ AZURE_SPEECH_KEY: "k" }).voice).toBe("azure");
    expect(features({ AZURE_SPEECH_KEY: "k", FEATURE_VOICE: "browser" }).voice).toBe("browser");
    expect(features({ FEATURE_VIDEO_CONSULT: "acs", ACS_CONNECTION_STRING: "c" }).videoConsult).toBe("acs");
    expect(features({ FEATURE_VARIANT_WATCH: "job", FEATURE_RESULT_VIDEO: "render" })).toMatchObject({ variantWatch: "job", resultVideo: "render" });
  });

  it("ignores unknown values", () => {
    expect(features({ FEATURE_VARIANT_WATCH: "nonsense" }).variantWatch).toBe("cron");
  });
});

describe("rate limiting helpers", () => {
  it("windows are aligned to the hour", () => {
    expect(windowStart(new Date("2026-11-14T10:59:59Z"), HOUR).toISOString()).toBe("2026-11-14T10:00:00.000Z");
    expect(windowStart(new Date("2026-11-14T11:00:00Z"), HOUR).toISOString()).toBe("2026-11-14T11:00:00.000Z");
  });

  it("visitors are keyed by a hash, never by the address itself", () => {
    const k = visitorKey("203.0.113.9", "secret");
    expect(k).toMatch(/^[0-9a-f]{32}$/);
    expect(k).not.toContain("203");
    expect(visitorKey("203.0.113.9", "secret")).toBe(k);
    expect(visitorKey("203.0.113.10", "secret")).not.toBe(k);
    expect(visitorKey("203.0.113.9", "other")).not.toBe(k);
  });

  it("reads the first forwarded address", () => {
    const h = (o: Record<string, string>) => ({ get: (n: string) => o[n] ?? null });
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
    expect(clientIp(h({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIp(h({}))).toBe("unknown");
  });

  it("limits fall back to defaults for bad settings", () => {
    expect(positiveInt("50", 20)).toBe(50);
    expect(positiveInt(undefined, 20)).toBe(20);
    expect(positiveInt("0", 20)).toBe(20);
    expect(positiveInt("abc", 20)).toBe(20);
  });

  it("the limit message is bilingual, labelled, and involves no model", () => {
    const en = rateLimitedReply("en", "visitor", "claude");
    const ar = rateLimitedReply("ar", "site", "claude");
    expect(en.label).toBe("education");
    expect(en.text).toMatch(/limit of questions for this hour/);
    expect(ar.text).toMatch(/[؀-ۿ]/);
    expect(en.steps).toEqual([{ agent: "orchestrator", detail: "rate_limited:visitor" }]);
    expect(en.escalations).toEqual([]);
  });
});
