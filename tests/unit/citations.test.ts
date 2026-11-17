import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { CITATION_ID, RAW_KEY, citationIds, stripCitations } from "@/lib/ai/citations";
import { buildIndex } from "@/lib/ai/knowledge";
import { citedIds } from "@/lib/ai/safety";
import { speakable } from "@/lib/voice/azure";
import { runCopilot } from "@/lib/ai/copilot";
import { mockProvider } from "@/lib/ai/providers/mock";
import type { CopilotContext, FactSheet } from "@/lib/ai/types";

const LOCALES = ["en", "ar"] as const;
const LEVELS = ["simple", "standard", "detailed"] as const;

describe("Copilot source markers never reach the screen", () => {
  it("every passage the Copilot can cite, in both languages, is hidden on screen and in speech, and counted as a source", () => {
    for (const locale of LOCALES) {
      for (const level of LEVELS) {
        const passages = buildIndex(locale, level);
        const sheet: FactSheet = { passages, numbers: [], notes: [] };
        for (const p of passages) {
          expect(p.id, p.id).toMatch(CITATION_ID);
          const answer = `${p.title}. [${p.id}]`;
          expect(stripCitations(answer), p.id).toBe(`${p.title}.`);
          expect(speakable(answer), p.id).not.toMatch(RAW_KEY);
          expect(citationIds(answer)).toEqual([p.id]);
          expect(citedIds(answer, sheet)).toEqual([p.id]);
          expect(`${p.title} ${p.text}`, p.id).not.toMatch(RAW_KEY);
        }
      }
    }
  });

  it("the case that showed on screen: a classification with an underscore", () => {
    const text = "Likely benign means harmless. [explainer.acmg#likely_benign]\n\nNext. [explainer.acmg#likely_pathogenic]";
    expect(stripCitations(text)).toBe("Likely benign means harmless.\n\nNext.");
    expect(citationIds(text)).toEqual(["explainer.acmg#likely_benign", "explainer.acmg#likely_pathogenic"]);
  });

  it("the raw key pattern catches keys and leaves ordinary brackets alone", () => {
    for (const bad of ["[explainer.acmg#likely_benign]", "[nav.result]", "[couple.planTitle]", "[condition.sickle-cell#carriers]"]) expect(bad).toMatch(RAW_KEY);
    for (const ok of ["[1]", "(see above)", "[Note]", "25% [estimate]"]) expect(ok).not.toMatch(RAW_KEY);
  });

  it("offline Copilot answers in both languages show no raw key", async () => {
    const questions = {
      en: ["What does being a carrier mean?", "What is a variant of uncertain significance?", "What does likely benign mean?", "We are both carriers. What is the chance for each pregnancy?", "What are our options?"],
      ar: ["ما معنى أن أكون حاملاً؟", "ما معنى متغير غير مؤكد الأهمية؟", "ماذا يعني محتمل أنه حميد؟", "كلانا حامل. ما الاحتمال في كل حمل؟", "ما هي خياراتنا؟"],
    };
    for (const locale of LOCALES) {
      const ctx: CopilotContext = { locale, level: "standard", ownFindings: [{ gene: "HBB", classification: "pathogenic", condition: "Beta thalassaemia" }] };
      for (const q of questions[locale]) {
        const reply = await runCopilot(q, [], ctx, mockProvider);
        expect(stripCitations(reply.text), q).not.toMatch(RAW_KEY);
        for (const c of reply.citations) expect(c.title, q).not.toMatch(RAW_KEY);
        const titles = reply.citations.map((c) => `${c.title}|${c.href ?? ""}`);
        expect(new Set(titles).size, `${q}: each source listed once`).toBe(titles.length);
      }
    }
  });
});

describe("translations", () => {
  it("no message in either language is itself a raw key or contains one", () => {
    for (const locale of LOCALES) {
      const walk = (o: unknown, path: string) => {
        if (typeof o === "string") {
          expect(o, `${locale}:${path}`).not.toMatch(RAW_KEY);
          expect(o, `${locale}:${path}`).not.toMatch(/^[a-z]+(\.[a-zA-Z]+)+$/); // "nav.result" left as a value
        } else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
      };
      walk(JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8")), "");
    }
  });
});
