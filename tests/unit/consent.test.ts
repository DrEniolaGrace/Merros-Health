import { describe, expect, it } from "vitest";
import { coupleConsentsActive, hasActiveConsent, type ConsentLike } from "@/lib/consent/check";

const now = new Date("2026-11-08T12:00:00Z");
const day = 86_400_000;
const c = (o: Partial<ConsentLike> = {}): ConsentLike => ({
  purpose: "view_own_result", recipient: "self", grantedAt: new Date(now.getTime() - day), expiresAt: null, revokedAt: null, ...o,
});

describe("consent gate", () => {
  it("default is deny: no consents", () => expect(hasActiveConsent([], "view_own_result", now)).toBe(false));
  it("granted and open ended", () => expect(hasActiveConsent([c()], "view_own_result", now)).toBe(true));
  it("not yet valid", () => expect(hasActiveConsent([c({ grantedAt: new Date(now.getTime() + day) })], "view_own_result", now)).toBe(false));
  it("expired", () => expect(hasActiveConsent([c({ expiresAt: new Date(now.getTime() - 1) })], "view_own_result", now)).toBe(false));
  it("expires exactly now counts as expired", () => expect(hasActiveConsent([c({ expiresAt: now })], "view_own_result", now)).toBe(false));
  it("not yet expired", () => expect(hasActiveConsent([c({ expiresAt: new Date(now.getTime() + day) })], "view_own_result", now)).toBe(true));
  it("revoked", () => expect(hasActiveConsent([c({ revokedAt: new Date(now.getTime() - 1) })], "view_own_result", now)).toBe(false));
  it("wrong purpose", () => expect(hasActiveConsent([c({ purpose: "aggregate_analytics" })], "view_own_result", now)).toBe(false));
  it("one active among revoked ones is enough", () =>
    expect(hasActiveConsent([c({ revokedAt: now }), c()], "view_own_result", now)).toBe(true));

  it("couple comparison needs both partners", () => {
    const yes = [c({ purpose: "couple_comparison", recipient: "partner" })];
    expect(coupleConsentsActive(yes, yes, now)).toBe(true);
    expect(coupleConsentsActive(yes, [], now)).toBe(false);
    expect(coupleConsentsActive([], yes, now)).toBe(false);
    expect(coupleConsentsActive(yes, [c({ purpose: "couple_comparison", revokedAt: now })], now)).toBe(false);
  });
});
