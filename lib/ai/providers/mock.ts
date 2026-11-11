/**
 * Offline provider: deterministic, no network, no key. It routes with keywords and composes the
 * answer directly from approved passages and engine numbers, so the demo and CI work without an
 * AI account. It is not a language model and says so in the interface.
 */
import type { AiProvider, ToolCall } from "../types";

const RISK = /chance|risk|percent|%|probab|likel|will (our|my|the) (baby|child)|both (of us )?(are )?carr|1 in 4|احتمال|نسبة|خطر|كلانا|هل سيصاب/i;
const ONE_CARRIER = /only (one|i|me|my partner)|partner is not|not a carrier|one of us|أحدنا|شريكي ليس|واحد فقط/i;
const TWO_GENES = /two (shared )?genes|2 genes|both genes|more than one gene|جينين|جينان|أكثر من جين/i;
const MINE = /\bmy (result|gene|variant|test|report)|\bam i\b|do i (have|carry)|نتيجتي|جيني|هل أنا|فحصي/i;
const VUS = /\bvus\b|uncertain significance|غير مؤكد/i;

export const mockProvider: AiProvider = {
  name: "offline-demo",

  async interpret({ question, runTool }) {
    const calls: ToolCall[] = [{ name: "search_content", input: { query: question } }];
    if (MINE.test(question)) calls.push({ name: "my_result", input: {} });
    if (VUS.test(question)) calls.push({ name: "explain_classification", input: { classification: "vus" } });
    if (RISK.test(question)) {
      if (TWO_GENES.test(question)) calls.push({ name: "couple_combined_risk", input: { shared_genes: 2 } });
      else calls.push({ name: "carrier_outcomes", input: { partner_a_carrier: true, partner_b_carrier: !ONE_CARRIER.test(question) } });
    }
    for (const c of calls) runTool(c);
    return { calls };
  },

  async explain({ factSheet, ctx }) {
    const ar = ctx.locale === "ar";
    const limit = ctx.level === "simple" ? 1 : ctx.level === "standard" ? 2 : 3;
    const parts: string[] = [];
    if (factSheet.numbers.length) {
      const nums = factSheet.numbers.map((n) => `${n.label}: ${n.value}`).join(ar ? "، " : "; ");
      parts.push(ar ? `بحسب محرك الاحتمالات في ميرّوس: ${nums}.` : `From the Merros risk engine: ${nums}.`);
    }
    for (const note of factSheet.notes) parts.push(note);
    for (const p of factSheet.passages.slice(0, limit)) parts.push(`${p.text} [${p.id}]`);
    if (!parts.length) {
      return ar
        ? "لا أملك معلومات معتمدة عن هذا السؤال. يمكن لمستشار وراثي مساعدتك فيه."
        : "I do not have approved information on that question. A genetic counsellor can help you with it.";
    }
    return parts.join(" ");
  },

  async adapt({ text }) {
    return text;
  },

  async classify({ text }) {
    const decision = /\boption|choice|choose|decid|ivf|prenatal|خيار|خيارات|قرار/i.test(text);
    return { label: decision ? "decision_support" : "education", reason: "offline heuristic" };
  },
};
