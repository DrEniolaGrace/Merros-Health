/**
 * Safety Verifier, rules stage (SPEC 6.5), and input screening for the Orchestrator.
 * Deterministic, bilingual, unit tested. Runs before and independently of any model classifier.
 */
import type { FactSheet, Locale } from "./types";

export interface RuleHit {
  rule: string;
  kind: "directive" | "stigmatising" | "diagnostic" | "unverified_number" | "missing_citation";
}

const OUTPUT_RULES: { rule: string; kind: RuleHit["kind"]; re: RegExp }[] = [
  // Directive: telling someone whom to marry or what to decide.
  { rule: "en.should_marry", kind: "directive", re: /\byou (should|must|ought to|need to|have to)( not|n't)? (marry|get married|cancel|call off|break off|have children|avoid having|terminate|abort)/i },
  { rule: "en.should_not_generic", kind: "directive", re: /\byou (should|must)( not|n't) (marry|have (a )?(baby|child|children)|get pregnant)/i },
  { rule: "en.right_choice", kind: "directive", re: /\b(the|your) (right|best|correct|only|wise|responsible) (choice|option|decision|thing to do) (is|would be)\b/i },
  { rule: "en.i_recommend", kind: "directive", re: /\b(i|we) (strongly )?(recommend|advise|urge|suggest) (that )?you (do not|don't|not |should|must|marry|cancel|choose|have|avoid|terminate)/i },
  { rule: "en.do_not_marry", kind: "directive", re: /\b(do not|don't) (marry|have children|get pregnant)\b/i },
  { rule: "ar.should_marry", kind: "directive", re: /(يجب|ينبغي|عليك|عليكما|لا بد)( عليك| عليكما)?( أن)? (لا |ألا )?(تتزوج|تتزوجي|تتزوجا|تلغي|تلغيا|تنجب|تنجبي|تنجبا|تجهض|تجهضي)/ },
  { rule: "ar.do_not_marry", kind: "directive", re: /لا (تتزوج|تتزوجي|تتزوجا|تنجب|تنجبي|تنجبا)/ },
  { rule: "ar.right_choice", kind: "directive", re: /(الخيار|القرار|الحل) (الصحيح|الأفضل|الأنسب|الوحيد|الصائب) (هو|لك|لكما)/ },
  { rule: "ar.i_recommend", kind: "directive", re: /(أنصحك|أنصحكما|ننصحك|ننصحكما|أوصيك|نوصيك)/ },
  // Stigmatising language.
  { rule: "en.bad_genes", kind: "stigmatising", re: /\b(bad|faulty|defective|dirty|inferior) (gene|genes|blood|dna)\b|\bdefective\b|\babnormal (child|baby|person|people)\b|\bdamaged goods\b/i },
  { rule: "ar.bad_genes", kind: "stigmatising", re: /(جينات|جين|دم) (سيئ|سيئة|معيب|معيبة|فاسد|فاسدة)|معيب|معيبة|طفل (مشوه|غير طبيعي)/ },
  // A couple is never labelled incompatible or unsuitable: they have a shared carrier result.
  { rule: "en.couple_label", kind: "stigmatising", re: /\b(incompatib(le|ility)|not (genetically )?compatible|genetic(ally)? (unsuitable|unfit|mismatch(ed)?)|bad match)\b/i },
  { rule: "ar.couple_label", kind: "stigmatising", re: /(غير متوافق|غير متوافقين|غير متوافقة|عدم (ال)?توافق|غير متلائم|غير مناسبين وراثيا)/ },
  // Diagnostic certainty about a person or a future child.
  { rule: "en.will_have", kind: "diagnostic", re: /\byour (baby|child|children|son|daughter) will (have|be born with|suffer|be affected|inherit the (disease|condition))\b|\byou (have|are diagnosed with) (the )?(disease|thalassaemia|thalassemia|sickle cell disease|sma)\b/i },
  { rule: "ar.will_have", kind: "diagnostic", re: /(سيصاب|سيولد|ستصاب) (طفلك|طفلكما|ابنك|ابنتك|أطفالك)|(طفلك|طفلكما) (سيصاب|سيكون مصاباً|مصاب حتماً)|أنت (مصاب|مصابة) ب/ },
];

/** Percentages written in the text, normalised ("25", "43.75"). Also catches Arabic-Indic digits. */
export function percentagesIn(text: string): string[] {
  const latin = text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/٫/g, ".");
  return [...latin.matchAll(/(\d+(?:\.\d+)?)\s*[%٪]/g)].map((m) => String(Number(m[1])));
}

/**
 * Checks a draft answer. Any percentage must come from the risk engine or approved content in
 * the fact sheet; directive, stigmatising or diagnostic wording is never allowed.
 */
export function checkOutput(text: string, sheet: FactSheet, opts: { requireCitation?: boolean } = {}): RuleHit[] {
  const hits: RuleHit[] = [];
  for (const r of OUTPUT_RULES) if (r.re.test(text)) hits.push({ rule: r.rule, kind: r.kind });
  const allowed = new Set([...sheet.numbers.flatMap((n) => percentagesIn(n.value)), ...sheet.passages.flatMap((p) => percentagesIn(p.text)), ...sheet.notes.flatMap(percentagesIn)]);
  for (const p of percentagesIn(text)) if (!allowed.has(p)) hits.push({ rule: `number:${p}%`, kind: "unverified_number" });
  if (opts.requireCitation && sheet.passages.length > 0 && citedIds(text, sheet).length === 0) hits.push({ rule: "no_citation", kind: "missing_citation" });
  return hits;
}

/** Passage ids cited in the text as [id]. Unknown ids are ignored. */
export function citedIds(text: string, sheet: FactSheet): string[] {
  const known = new Set(sheet.passages.map((p) => p.id));
  return [...new Set([...text.matchAll(/\[([a-z0-9.#-]+)\]/gi)].map((m) => m[1]).filter((id) => known.has(id)))];
}

export type InputIntent = "explain" | "medical_advice" | "decide_for_me" | "distress" | "off_topic_empty";

const INPUT_RULES: { intent: Exclude<InputIntent, "explain">; re: RegExp }[] = [
  { intent: "distress", re: /\b(kill myself|suicid|end my life|can'?t go on|no reason to live|hurt myself|hopeless)\b|انتحر|أنهي حياتي|لا أستطيع الاستمرار|أؤذي نفسي|لا فائدة من حياتي/i },
  { intent: "decide_for_me", re: /\bshould (i|we) (still )?(marry|get married|cancel|call off|break (up|off)|have (a )?(baby|child|children|kids)|get pregnant|do ivf|terminate|abort)|\bwhat (should|would you) (i|we|you) (do|choose|decide)|\b(tell me|decide) what to do\b|\bis it (wrong|a mistake|ok|okay|safe) to marry|هل (يجب|ينبغي|علي|علينا|أتزوج|نتزوج|ألغي|نلغي|أنجب|ننجب)|ماذا (أفعل|نفعل|أختار|نختار|تنصح)|قرر (لي|لنا)|هل الزواج (خطأ|آمن)/i },
  { intent: "medical_advice", re: /\b(what|which) (medicine|medication|drug|dose|treatment) should|\bshould (i|we|my \w+) (take|stop|start)\b|\b(diagnose|prescribe)\b|\bis my (baby|child|pregnancy) (affected|sick|ok|okay|healthy)\b|\bdo i need (a|an|to)\b|أي (دواء|علاج|جرعة)|هل (آخذ|أتناول|أوقف)|شخّص|وصفة|هل (طفلي|جنيني|حملي) (مصاب|سليم|بخير)|هل أحتاج/i },
];

/** Orchestrator input screening: decides when a human is needed before any model is called. */
export function screenInput(question: string): InputIntent {
  if (!question.trim()) return "off_topic_empty";
  for (const r of INPUT_RULES) if (r.re.test(question)) return r.intent;
  return "explain";
}

/** Rough readability: average words per sentence (works for English and Arabic). */
export function wordsPerSentence(text: string): number {
  const clean = text.replace(/\[[^\]]+\]/g, "");
  const sentences = clean.split(/[.!?؟。]+/).map((s) => s.trim()).filter(Boolean);
  if (!sentences.length) return 0;
  const words = clean.split(/\s+/).filter(Boolean).length;
  return words / sentences.length;
}

export const hasArabic = (s: string) => /[؀-ۿ]/.test(s);
export type { Locale };
