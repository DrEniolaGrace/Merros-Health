/**
 * Merros Genetic Copilot pipeline (SPEC 6.5). Six agents in a fixed order:
 *   Orchestrator -> Variant Interpreter -> Explainer -> Cultural and Dialect Adapter
 *   -> Safety Verifier -> Escalation Agent
 * No database or network access here except through the provider, so the whole pipeline can be
 * evaluated offline. No identifiers are ever part of the inputs.
 */
import type { EscalationCode } from "@/lib/escalation/rules";
import { CLASSIFIER_SYSTEM, DIALECT_SYSTEM, EXPLAINER_SYSTEM, INTERPRETER_SYSTEM, PROMPT_VERSION } from "./prompts/v1";
import { checkOutput, citedIds, screenInput } from "./safety";
import { TOOL_SPECS, createToolbox } from "./tools";
import type { AgentStep, AiProvider, ChatTurn, CopilotContext, CopilotReply, FactSheet } from "./types";

export const MAX_QUESTION_CHARS = 600;
const MAX_HISTORY_TURNS = 6;

const SCRIPT = {
  distress: {
    en: "It sounds like this is very hard right now, and you do not have to carry it alone. A counsellor or psychologist can call you this week, and I have asked for that. If you feel you might harm yourself, please contact local emergency services now or tell someone near you.",
    ar: "يبدو أن الأمر صعب جداً عليك الآن، ولست مضطراً لتحمّله وحدك. يمكن لمستشار أو أخصائي نفسي الاتصال بك هذا الأسبوع، وقد طلبتُ ذلك لك. إذا شعرت أنك قد تؤذي نفسك، يُرجى الاتصال بخدمات الطوارئ المحلية الآن أو إخبار شخص قريب منك.",
  },
  decide: {
    en: "This is your decision, and Merros will never make it for you or tell you whom to marry. What I can do is explain what your result means and lay out every option evenly, so you can decide by your own values. Many couples find it helps to talk it through with a genetic counsellor, and I can offer you a session.",
    ar: "هذا قرارك أنت، ولن يتخذه ميرّوس عنك ولن يخبرك بمن تتزوج. ما أستطيعه هو شرح معنى نتيجتك وعرض كل الخيارات بالتساوي، لتقرر وفق قيمك. يجد كثير من الأزواج أن الحديث مع مستشار وراثي يساعدهم، ويمكنني أن أعرض عليك جلسة.",
  },
  medical: {
    en: "That question needs personal medical advice, which only a qualified clinician can give. I can explain the general background, and I have offered you a session with a genetic counsellor who can answer it for your situation.",
    ar: "هذا السؤال يحتاج إلى مشورة طبية شخصية، ولا يقدّمها إلا مختص مؤهل. أستطيع شرح الخلفية العامة، وقد عرضتُ عليك جلسة مع مستشار وراثي يجيب عنه بما يناسب حالتك.",
  },
  blocked: {
    en: "I could not give a safe answer to that in my own words, so I would rather not guess. A genetic counsellor can answer it properly, and I have offered you a session.",
    ar: "لم أتمكن من تقديم إجابة آمنة عن هذا السؤال بصياغتي، ولذلك أفضّل ألا أخمّن. يمكن لمستشار وراثي الإجابة عنه كما ينبغي، وقد عرضتُ عليك جلسة.",
  },
  unavailable: {
    en: "I cannot answer right now. Your information is safe. Please try again in a moment, or talk to a genetic counsellor.",
    ar: "لا أستطيع الإجابة الآن. معلوماتك في أمان. يُرجى المحاولة بعد قليل، أو التحدث مع مستشار وراثي.",
  },
  empty: {
    en: "Ask me anything about your result, carrier status, a condition or your options.",
    ar: "اسألني عن نتيجتك أو معنى أن تكون حاملاً أو عن حالة معينة أو عن خياراتك.",
  },
};

function contextLine(ctx: CopilotContext): string {
  const findings = ctx.ownFindings === null ? "no result available" : ctx.ownFindings.length ? ctx.ownFindings.map((f) => `${f.gene} ${f.classification}`).join(", ") : "no changes found";
  return `Reader language: ${ctx.locale === "ar" ? "Arabic" : "English"}. Reading level: ${ctx.level}. Their screening findings: ${findings}.`;
}

function scripted(kind: keyof typeof SCRIPT, ctx: CopilotContext, base: Pick<CopilotReply, "steps" | "provider">, extra: Partial<CopilotReply> = {}): CopilotReply {
  return {
    text: SCRIPT[kind][ctx.locale],
    label: kind === "decide" ? "decision_support" : "education",
    citations: [],
    escalations: [],
    blocked: false,
    guard: [],
    promptVersion: PROMPT_VERSION,
    ...base,
    ...extra,
  };
}

export async function runCopilot(questionRaw: string, history: ChatTurn[], ctx: CopilotContext, provider: AiProvider): Promise<CopilotReply> {
  const question = questionRaw.trim().slice(0, MAX_QUESTION_CHARS);
  const steps: AgentStep[] = [];
  const base = { steps, provider: provider.name };

  // 1. Orchestrator: route, and decide when a human is needed before any model runs.
  const intent = screenInput(question);
  steps.push({ agent: "orchestrator", detail: `intent: ${intent}` });
  if (intent === "off_topic_empty") return scripted("empty", ctx, base);
  if (intent === "distress") {
    steps.push({ agent: "escalation", detail: "high_distress" });
    return scripted("distress", ctx, base, { escalations: ["high_distress"], guard: [{ stage: "input", rule: "distress", action: "escalated" }] });
  }
  if (intent === "decide_for_me") {
    steps.push({ agent: "escalation", detail: "medical_advice_requested" });
    return scripted("decide", ctx, base, { escalations: ["medical_advice_requested"], guard: [{ stage: "input", rule: "decide_for_me", action: "escalated" }] });
  }

  try {
    // 2. Variant Interpreter: gathers facts through tools only.
    const box = createToolbox(ctx);
    const { calls } = await provider.interpret({ system: INTERPRETER_SYSTEM, question, context: contextLine(ctx), tools: TOOL_SPECS, runTool: box.run });
    // Retrieval is guaranteed even if the model skipped it.
    if (!calls.some((c) => c.name === "search_content")) box.run({ name: "search_content", input: { query: question } });
    const sheet: FactSheet = box.sheet;
    steps.push({ agent: "interpreter", detail: `tools: ${[...new Set(calls.map((c) => c.name))].join(", ") || "search_content"}; ${sheet.passages.length} passages, ${sheet.numbers.length} engine numbers` });

    // 3. Explainer: writes from the fact sheet only.
    let draft = await provider.explain({ system: EXPLAINER_SYSTEM, question, factSheet: sheet, history: history.slice(-MAX_HISTORY_TURNS), ctx });
    steps.push({ agent: "explainer", detail: `level: ${ctx.level}` });

    // 4. Cultural and Dialect Adapter (Arabic only). Rejected if it alters numbers or citations.
    if (ctx.locale === "ar") {
      const adapted = await provider.adapt({ system: DIALECT_SYSTEM, text: draft });
      const same = citedIds(adapted, sheet).join() === citedIds(draft, sheet).join() && checkOutput(adapted, sheet).length === 0;
      if (adapted.trim() && same) draft = adapted;
      steps.push({ agent: "dialect", detail: adapted.trim() && same ? "Gulf Arabic adaptation applied" : "adaptation discarded (changed facts or citations)" });
    }

    // 5. Safety Verifier: rules first, then the model classifier.
    const hits = checkOutput(draft, sheet, { requireCitation: true });
    if (hits.length) {
      steps.push({ agent: "verifier", detail: `blocked by rules: ${hits.map((h) => h.rule).join(", ")}` }, { agent: "escalation", detail: "safety_verifier_block" });
      return scripted("blocked", ctx, base, {
        blocked: true,
        escalations: ["safety_verifier_block"],
        guard: hits.map((h) => ({ stage: "rules" as const, rule: `${h.kind}:${h.rule}`, action: "replaced_with_escalation" })),
      });
    }
    const verdict = await provider.classify({ system: CLASSIFIER_SYSTEM, text: draft });
    if (verdict.label === "prohibited") {
      steps.push({ agent: "verifier", detail: "blocked by classifier" }, { agent: "escalation", detail: "safety_verifier_block" });
      return scripted("blocked", ctx, base, { blocked: true, escalations: ["safety_verifier_block"], guard: [{ stage: "classifier", rule: "prohibited", action: "replaced_with_escalation" }] });
    }
    const cited = citedIds(draft, sheet).map((id) => sheet.passages.find((p) => p.id === id)!);
    const label = verdict.label === "decision_support" || cited.some((p) => p.label === "decision_support") ? "decision_support" : "education";
    steps.push({ agent: "verifier", detail: `passed rules and classifier: ${label}` });

    // 6. Escalation Agent.
    const escalations: EscalationCode[] = [];
    let text = draft;
    if (intent === "medical_advice") {
      escalations.push("medical_advice_requested");
      text = `${SCRIPT.medical[ctx.locale]}\n\n${draft}`;
      steps.push({ agent: "escalation", detail: "medical_advice_requested" });
    }

    return {
      text,
      label,
      citations: cited.map((p) => ({ id: p.id, title: p.title, href: p.href })),
      escalations,
      blocked: false,
      guard: intent === "medical_advice" ? [{ stage: "input", rule: "medical_advice", action: "escalated" }] : [],
      steps,
      provider: provider.name,
      promptVersion: PROMPT_VERSION,
    };
  } catch {
    steps.push({ agent: "verifier", detail: "provider error: safe fallback" });
    return scripted("unavailable", ctx, base);
  }
}
