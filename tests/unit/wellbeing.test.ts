import { describe, expect, it } from "vitest";
import { DISTRESS_THRESHOLD, emptyContext, evaluateEscalation } from "@/lib/escalation/rules";
import { distressBand, offersCallback, validDistress, DISTRESS_HIGH } from "@/lib/wellbeing/distress";
import { decisionalConflict, importantValues, relateOptions, sureScore, validRatings, validSure, type Ratings, type SureAnswers } from "@/lib/values/compass";
import { CRISIS_PLACEHOLDERS, DISTRESS_SUPPORT, IMPORTANCE, OPTION_FIT, OPTION_IDS, SURE_ITEMS, VALUES, VALUE_KEYS } from "@/content/values";
import { OPTIONS } from "@/content/options";
import { checkOutput } from "@/lib/ai/safety";

const EMPTY = { passages: [], numbers: [], notes: [] };

const ratings = (over: Partial<Ratings> = {}): Ratings => ({ faith: 0, family: 0, biological: 0, procedures: 0, certainty: 0, cost: 0, time: 0, ...over });
const yes: SureAnswers = { sure: true, understand: true, riskBenefit: true, encouragement: true };

describe("Distress Check", () => {
  it("accepts only whole numbers from 0 to 10", () => {
    for (const ok of [0, 4, 10]) expect(validDistress(ok)).toBe(true);
    for (const bad of [-1, 11, 3.5, "5", null, undefined, NaN]) expect(validDistress(bad)).toBe(false);
  });

  it("bands follow the escalation threshold and the high mark", () => {
    expect(distressBand(0)).toBe("low");
    expect(distressBand(DISTRESS_THRESHOLD - 1)).toBe("low");
    expect(distressBand(DISTRESS_THRESHOLD)).toBe("moderate");
    expect(distressBand(DISTRESS_HIGH - 1)).toBe("moderate");
    expect(distressBand(DISTRESS_HIGH)).toBe("high");
    expect(distressBand(10)).toBe("high");
    expect(() => distressBand(11)).toThrow();
  });

  it("offers a callback exactly when the escalation rule fires", () => {
    for (let s = 0; s <= 10; s++) {
      const fired = evaluateEscalation(emptyContext({ distressScore: s })).some((e) => e.code === "high_distress");
      expect(offersCallback(s)).toBe(fired);
      expect(fired).toBe(s >= DISTRESS_THRESHOLD);
    }
  });

  it("a distress escalation is urgent, and absent when no check was done", () => {
    expect(evaluateEscalation(emptyContext({ distressScore: 8 })).find((e) => e.code === "high_distress")?.severity).toBe("urgent");
    expect(evaluateEscalation(emptyContext({ distressScore: null })).some((e) => e.code === "high_distress")).toBe(false);
  });

  it("support content exists for every band in both languages, and crisis contacts are marked unverified", () => {
    for (const band of ["low", "moderate", "high"] as const) {
      const s = DISTRESS_SUPPORT[band];
      for (const b of [s.title, s.body, ...s.tips]) {
        expect(b.en.length).toBeGreaterThan(5);
        expect(b.ar).toMatch(/[؀-ۿ]/);
      }
    }
    for (const c of CRISIS_PLACEHOLDERS) {
      expect(c.en).toMatch(/verified before release/);
      expect(c.en).not.toMatch(/\d{3,}/); // no real looking phone number may ship unverified
    }
  });
});

describe("Values Compass", () => {
  it("validates ratings and SURE answers strictly", () => {
    expect(validRatings(ratings())).toBe(true);
    expect(validRatings(ratings({ faith: 4 }))).toBe(true);
    expect(validRatings(ratings({ faith: 5 }))).toBe(false);
    expect(validRatings(ratings({ cost: 1.5 }))).toBe(false);
    expect(validRatings({ faith: 1 })).toBe(false);
    expect(validRatings({ ...ratings(), tribe: 2 })).toBe(false);
    expect(validRatings(null)).toBe(false);
    expect(validSure(yes)).toBe(true);
    expect(validSure({ ...yes, sure: "yes" })).toBe(false);
    expect(validSure({ sure: true })).toBe(false);
  });

  it("only values rated very important or essential are compared", () => {
    expect(importantValues(ratings({ biological: 3, cost: 4, time: 2 }))).toEqual(["biological", "cost"]);
    expect(importantValues(ratings())).toEqual([]);
  });

  it("relates every option, keeps the given order, and never scores or ranks", () => {
    const r = ratings({ biological: 4, procedures: 3, faith: 4 });
    const order = [...OPTION_IDS].reverse();
    const fit = relateOptions(r, order);
    expect(fit.map((f) => f.optionId)).toEqual(order);
    for (const f of fit) {
      expect(Object.keys(f).sort()).toEqual(["depends", "fits", "optionId", "tension"]); // no score, rank or "best" field
      expect([...f.fits, ...f.tension, ...f.depends].sort()).toEqual(["biological", "faith", "procedures"]);
      expect(f.depends).toContain("faith");
    }
    expect(fit.find((f) => f.optionId === "ivf-pgtm")).toMatchObject({ fits: ["biological"], tension: ["procedures"] });
    expect(fit.find((f) => f.optionId === "fostering")).toMatchObject({ fits: ["procedures"], tension: ["biological"] });
  });

  it("is the same regardless of the order options are shown in", () => {
    const r = ratings({ certainty: 4, time: 3 });
    const a = relateOptions(r);
    const b = relateOptions(r, [...OPTION_IDS].reverse());
    for (const f of a) expect(b.find((x) => x.optionId === f.optionId)).toEqual(f);
  });

  it("never presumes what a person's faith or family asks of them", () => {
    for (const id of OPTION_IDS) {
      expect(OPTION_FIT[id].faith).toBe("depends");
      expect(OPTION_FIT[id].family).toBe("depends");
    }
  });

  it("covers exactly the seven options of the Options Explorer and the seven values of the spec", () => {
    expect([...OPTION_IDS].sort()).toEqual(OPTIONS.map((o) => o.optionId).sort());
    expect(VALUE_KEYS).toHaveLength(7);
    for (const id of OPTION_IDS) expect(Object.keys(OPTION_FIT[id]).sort()).toEqual([...VALUE_KEYS].sort());
    expect(IMPORTANCE).toHaveLength(5);
  });

  it("every option has at least one value it fits and one it may pull against, so none looks best or worst", () => {
    for (const id of OPTION_IDS) {
      const rel = Object.values(OPTION_FIT[id]);
      expect(rel).toContain("fits");
      expect(rel).toContain("tension");
    }
  });

  it("SURE: four items, score is the number of yes answers, conflict below 4", () => {
    expect(SURE_ITEMS.map((i) => i.key)).toEqual(["sure", "understand", "riskBenefit", "encouragement"]);
    expect(sureScore(yes)).toBe(4);
    expect(decisionalConflict(yes)).toBe(false);
    expect(sureScore({ ...yes, encouragement: false, sure: false })).toBe(2);
    expect(decisionalConflict({ ...yes, understand: false })).toBe(true);
  });

  it("content is bilingual and passes the non directive wording rules", () => {
    const texts = [...VALUE_KEYS.flatMap((k) => [VALUES[k].title, VALUES[k].body]), ...SURE_ITEMS.map((i) => i.text), ...IMPORTANCE, ...(["low", "moderate", "high"] as const).flatMap((b) => [DISTRESS_SUPPORT[b].title, DISTRESS_SUPPORT[b].body, ...DISTRESS_SUPPORT[b].tips])];
    for (const t of texts) {
      expect(t.ar).toMatch(/[؀-ۿ]/);
      expect(checkOutput(t.en, EMPTY)).toEqual([]);
      expect(checkOutput(t.ar, EMPTY)).toEqual([]);
    }
  });
});
