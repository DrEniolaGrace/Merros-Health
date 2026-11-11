import { describe, expect, it } from "vitest";
import { runCopilot } from "@/lib/ai/copilot";
import { mockProvider } from "@/lib/ai/providers/mock";
import { search } from "@/lib/ai/knowledge";
import { TOOL_SPECS, createToolbox } from "@/lib/ai/tools";
import { checkOutput, percentagesIn, screenInput } from "@/lib/ai/safety";
import type { AiProvider, CopilotContext, FactSheet } from "@/lib/ai/types";

const en: CopilotContext = { locale: "en", level: "standard", ownFindings: [{ gene: "HBB", classification: "pathogenic", condition: "Beta thalassaemia" }] };
const ar: CopilotContext = { ...en, locale: "ar" };
const emptySheet: FactSheet = { passages: [], numbers: [], notes: [] };

/** A provider that behaves like the offline one but lets a test replace single stages. */
const withStage = (over: Partial<AiProvider>): AiProvider => ({ ...mockProvider, name: "test", ...over });

describe("retrieval", () => {
  it("finds the right content in English and Arabic", () => {
    expect(search("what is sickle cell disease", "en", "standard")[0].id).toBe("condition.sickle-cell");
    expect(search("ما هي الثلاسيميا بيتا", "ar", "standard")[0].id).toContain("beta-thalassaemia");
    expect(search("what does being a carrier mean", "en", "simple").map((p) => p.id)).toContain("explainer.carrier");
    expect(search("what are our options", "en", "standard").some((p) => p.label === "decision_support")).toBe(true);
  });
  it("returns nothing for an empty or unrelated query", () => {
    expect(search("", "en", "standard")).toEqual([]);
    expect(search("football scores tonight", "en", "standard")).toEqual([]);
  });
});

describe("tools return engine numbers only", () => {
  it("two carriers: 25 / 50 / 25", () => {
    const box = createToolbox(en);
    expect(JSON.parse(box.run({ name: "carrier_outcomes", input: { partner_a_carrier: true, partner_b_carrier: true } }))).toMatchObject({ affected: "25%", carrier: "50%", neither: "25%" });
    expect(box.sheet.numbers.map((n) => n.value)).toEqual(["25%", "50%", "25%"]);
  });
  it("one carrier: 0% affected", () => {
    const box = createToolbox(en);
    expect(JSON.parse(box.run({ name: "carrier_outcomes", input: { partner_a_carrier: true, partner_b_carrier: false } })).affected).toBe("0%");
  });
  it("two shared genes: 43.75% combined", () => {
    const box = createToolbox(en);
    expect(JSON.parse(box.run({ name: "couple_combined_risk", input: { shared_genes: 2 } })).combined).toBe("43.75%");
  });
  it("my_result carries no identifiers and respects 'not available'", () => {
    const box = createToolbox({ ...en, ownFindings: null });
    expect(JSON.parse(box.run({ name: "my_result", input: {} }))).toEqual({ available: false });
  });
  it("every tool schema is strict", () => {
    for (const t of TOOL_SPECS) expect(t.input_schema.additionalProperties).toBe(false);
  });
});

describe("Safety Verifier rules", () => {
  const blocked = [
    "You should not marry your cousin.",
    "The right choice is IVF.",
    "I recommend that you cancel the wedding.",
    "This is caused by bad genes.",
    "Their DNA is defective.",
    "Your baby will have thalassaemia.",
    "يجب أن لا تتزوجا.",
    "الخيار الصحيح هو أطفال الأنابيب.",
    "أنصحك بإلغاء الزواج.",
    "هذه جينات سيئة.",
    "سيصاب طفلك بالمرض.",
  ];
  it.each(blocked)("blocks: %s", (text) => expect(checkOutput(text, emptySheet).length).toBeGreaterThan(0));

  const allowed = [
    "Being a carrier means you have one changed copy of a gene and you are usually healthy.",
    "Some couples choose IVF with embryo testing, and others continue as planned. Each option is valid.",
    "A genetic counsellor can help you think about what matters to you.",
    "أن تكون حاملاً يعني أن لديك نسخة متغيرة واحدة وأنت بصحة جيدة عادةً.",
    "يختار بعض الأزواج فحص الأجنة، ويمضي آخرون في خططهم. كل خيار مشروع.",
  ];
  it.each(allowed)("allows: %s", (text) => expect(checkOutput(text, emptySheet)).toEqual([]));

  it("blocks any percentage that did not come from the engine or approved content", () => {
    const box = createToolbox(en);
    box.run({ name: "carrier_outcomes", input: { partner_a_carrier: true, partner_b_carrier: true } });
    expect(checkOutput("The chance is 25% each pregnancy.", box.sheet)).toEqual([]);
    expect(checkOutput("The chance is about 30% each pregnancy.", box.sheet)).toEqual([{ rule: "number:30%", kind: "unverified_number" }]);
    expect(percentagesIn("٢٥٪ و 43.75 %")).toEqual(["25", "43.75"]);
  });
});

describe("Orchestrator input screening", () => {
  it.each([
    ["What does being a carrier mean?", "explain"],
    ["Should I marry my cousin?", "decide_for_me"],
    ["What should we do?", "decide_for_me"],
    ["هل يجب أن ألغي الزواج؟", "decide_for_me"],
    ["Which medicine should my baby take?", "medical_advice"],
    ["Is my baby affected?", "medical_advice"],
    ["I feel hopeless and can't go on", "distress"],
    ["   ", "off_topic_empty"],
  ])("%s -> %s", (q, intent) => expect(screenInput(q)).toBe(intent));
});

describe("pipeline with the offline provider", () => {
  it("explains carrier status with a citation and the Education label", async () => {
    const r = await runCopilot("What does being a carrier mean?", [], en, mockProvider);
    expect(r.blocked).toBe(false);
    expect(r.label).toBe("education");
    expect(r.citations.map((c) => c.id)).toContain("explainer.carrier");
    expect(r.escalations).toEqual([]);
    expect(r.steps.map((s) => s.agent)).toEqual(["orchestrator", "interpreter", "explainer", "verifier"]);
  });
  it("answers chance questions with engine numbers", async () => {
    expect((await runCopilot("We are both carriers. What is the chance for each pregnancy?", [], en, mockProvider)).text).toContain("25%");
    expect((await runCopilot("What is the chance if we share two genes?", [], en, mockProvider)).text).toContain("43.75%");
    expect((await runCopilot("Only one of us is a carrier, what is the risk?", [], en, mockProvider)).text).toContain("0%");
  });
  it("answers in Arabic and runs the dialect adapter", async () => {
    const r = await runCopilot("ماذا يعني أن أكون حاملاً؟", [], ar, mockProvider);
    expect(r.text).toMatch(/[؀-ۿ]/);
    expect(r.steps.some((s) => s.agent === "dialect")).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });
  it("never decides for the person: offers a counsellor instead", async () => {
    for (const q of ["Should I marry my cousin?", "هل يجب أن نلغي الزواج؟"]) {
      const r = await runCopilot(q, [], q.startsWith("ه") ? ar : en, mockProvider);
      expect(r.escalations).toContain("medical_advice_requested");
      expect(checkOutput(r.text, emptySheet)).toEqual([]);
      expect(r.label).toBe("decision_support");
    }
  });
  it("escalates distress immediately, before any model call", async () => {
    let called = false;
    const r = await runCopilot("I feel hopeless", [], en, withStage({ interpret: async () => { called = true; return { calls: [] }; } }));
    expect(r.escalations).toEqual(["high_distress"]);
    expect(called).toBe(false);
  });
  it("escalates medical advice requests but still gives general background", async () => {
    const r = await runCopilot("Is my baby affected by thalassaemia?", [], en, mockProvider);
    expect(r.escalations).toEqual(["medical_advice_requested"]);
    expect(r.text).toContain("qualified clinician");
  });
});

describe("the Safety Verifier catches a misbehaving model", () => {
  const ask = (p: AiProvider) => runCopilot("What does being a carrier mean?", [], en, p);
  const expectBlocked = (r: Awaited<ReturnType<typeof ask>>) => {
    expect(r.blocked).toBe(true);
    expect(r.escalations).toEqual(["safety_verifier_block"]);
    expect(r.citations).toEqual([]);
    expect(r.text).toContain("genetic counsellor");
  };
  it("directive output is replaced with an escalation offer", async () => {
    const r = await ask(withStage({ explain: async () => "You should not marry. [explainer.carrier]" }));
    expectBlocked(r);
    expect(r.guard[0]).toMatchObject({ stage: "rules", action: "replaced_with_escalation" });
  });
  it("an invented risk number is blocked", async () => expectBlocked(await ask(withStage({ explain: async () => "Your chance is 12% per pregnancy. [explainer.carrier]" }))));
  it("an answer without a citation is blocked", async () => expectBlocked(await ask(withStage({ explain: async () => "Carriers are healthy." }))));
  it("a classifier verdict of prohibited is blocked", async () => {
    const r = await ask(withStage({ classify: async () => ({ label: "prohibited", reason: "directive" }) }));
    expectBlocked(r);
    expect(r.guard[0].stage).toBe("classifier");
  });
  it("a dialect rewrite that changes a number or drops a citation is discarded", async () => {
    const r = await runCopilot("ما احتمال إصابة الطفل إذا كان كلانا حاملاً؟", [], ar, withStage({ adapt: async () => "الاحتمال ٤٠٪ تقريباً." }));
    expect(r.blocked).toBe(false);
    expect(r.text).toContain("25%");
    expect(r.steps.find((s) => s.agent === "dialect")!.detail).toContain("discarded");
  });
  it("a provider failure gives a calm fallback, not an error", async () => {
    const r = await ask(withStage({ explain: async () => { throw new Error("network"); } }));
    expect(r.text).toContain("cannot answer right now");
    expect(r.escalations).toEqual([]);
  });
});

describe("no identifiers reach the model", () => {
  it("provider inputs contain only the question, level, language and gene level findings", async () => {
    const seen: string[] = [];
    const spy = withStage({
      interpret: async (i) => { seen.push(i.system, i.context, i.question); return mockProvider.interpret(i); },
      explain: async (i) => { seen.push(i.system, JSON.stringify(i.factSheet), JSON.stringify(i.ctx)); return mockProvider.explain(i); },
    });
    await runCopilot("What does my result mean?", [], en, spy);
    const all = seen.join(" ");
    expect(all).not.toMatch(/Mariam|Khalid|مريم|خالد|SADL-|@|\bc[a-z0-9]{24}\b/);
    expect(all).toContain("HBB");
  });
});
