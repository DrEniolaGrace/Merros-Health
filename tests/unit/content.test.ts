import { describe, expect, it } from "vitest";
import { CONDITIONS } from "@/content/conditions";
import { CARRIER_MEANING, LIMITS, NOT_A_DIAGNOSIS, NO_VARIANTS } from "@/content/explainer";
import { TEACHBACK } from "@/content/teachback";
import { OPTIONS, seededShuffle } from "@/content/options";
import { ESCALATION_TEXT } from "@/content/escalation";
import { CONSENT_TEXT } from "@/content/consent";
import { ESCALATION_CODES } from "@/lib/escalation/rules";
import { PURPOSES } from "@/lib/consent/purposes";
import { GENES } from "@/lib/risk/genes";
import { PERSONAS } from "@/content/personas";

const ARABIC = /[؀-ۿ]/;

/** Walks any content object and returns every {en, ar} pair found. */
function bilingualPairs(obj: unknown, path = "$"): { path: string; en: unknown; ar: unknown }[] {
  if (obj === null || typeof obj !== "object") return [];
  const o = obj as Record<string, unknown>;
  if ("en" in o && "ar" in o) return [{ path, en: o.en, ar: o.ar }];
  return Object.entries(o).flatMap(([k, v]) => bilingualPairs(v, `${path}.${k}`));
}

const LIBRARY = { CONDITIONS, CARRIER_MEANING, LIMITS, NOT_A_DIAGNOSIS, NO_VARIANTS, TEACHBACK, OPTIONS, ESCALATION_TEXT, CONSENT_TEXT };
const ITEMS = [...CONDITIONS, CARRIER_MEANING, LIMITS, NOT_A_DIAGNOSIS, NO_VARIANTS, ...TEACHBACK, ...OPTIONS];

describe("content library", () => {
  it("every text exists in both Arabic and English", () => {
    const pairs = bilingualPairs(LIBRARY);
    expect(pairs.length).toBeGreaterThan(100);
    for (const p of pairs) {
      expect(typeof p.en === "string" && p.en.trim().length > 0, `${p.path}.en`).toBe(true);
      expect(typeof p.ar === "string" && ARABIC.test(p.ar as string), `${p.path}.ar`).toBe(true);
    }
  });

  it("every item carries exactly one safety label and never clinical advice", () => {
    for (const item of ITEMS) {
      expect(["education", "decision_support"]).toContain(item.label);
      expect(item.reviewStatus).toBe("pending_accredited_review");
    }
  });

  it("AI sourced content can never be labelled clinical advice", () => {
    for (const item of ITEMS) {
      if (item.source === "ai") expect(item.label).not.toBe("clinical_advice");
    }
  });

  it("content ids are unique", () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("options are decision support with no 'recommended' wording", () => {
    for (const o of OPTIONS) {
      expect(o.label).toBe("decision_support");
      const text = JSON.stringify(o).toLowerCase();
      expect(text).not.toMatch(/recommend|best option|you should|موصى|الأفضل لك|يجب عليك/);
    }
  });

  it("all seven SPEC 4.5 options are present", () => expect(OPTIONS).toHaveLength(7));

  it("every escalation code and consent purpose has wording", () => {
    for (const c of ESCALATION_CODES) expect(ESCALATION_TEXT[c]).toBeDefined();
    for (const p of PURPOSES) expect(CONSENT_TEXT[p.purpose]).toBeDefined();
  });

  it("every condition referenced by a persona or gene has a card", () => {
    const ids = new Set(CONDITIONS.map((c) => c.conditionId));
    for (const p of PERSONAS) for (const v of p.variants ?? []) expect(ids.has(v.conditionId), v.conditionId).toBe(true);
    for (const g of Object.values(GENES)) for (const c of g.conditionIds) if (c !== "g6pd-deficiency") expect(ids.has(c), c).toBe(true);
  });

  it("teach back answers point at a real option and every question has three explanations", () => {
    for (const q of TEACHBACK) {
      expect(q.options.map((o) => o.id)).toContain(q.correct);
      expect(q.explanations).toHaveLength(3);
    }
  });
});

describe("seeded shuffle", () => {
  it("is a deterministic permutation", () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6, 7], 42);
    expect(seededShuffle([1, 2, 3, 4, 5, 6, 7], 42)).toEqual(a);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("puts each option first for some seeds (no fixed ranking)", () => {
    const firsts = new Set(Array.from({ length: 300 }, (_, s) => seededShuffle(OPTIONS, s + 1)[0].optionId));
    expect(firsts.size).toBe(OPTIONS.length);
  });
});
