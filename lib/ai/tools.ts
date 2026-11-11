/**
 * Tools for the Variant Interpreter (SPEC 6.5). All deterministic. The model chooses which to
 * call; every number comes from the tested risk engine, and every passage from approved content.
 * Tool outputs are collected into the fact sheet, which is all the Explainer may use.
 */
import { combineAffected, perPregnancy } from "@/lib/risk/engine";
import { HALF, ZERO, toPercentString } from "@/lib/risk/fraction";
import { ACMG_GUIDE } from "@/content/acmg";
import { pick } from "@/content/types";
import { search } from "./knowledge";
import type { CopilotContext, FactSheet, ToolCall, ToolSpec } from "./types";

/** Real ClinVar records used by the synthetic personas (data/reference/SOURCES.md). Live lookup arrives with Living Results. */
const CLINVAR_LOCAL: Record<string, { id: string; name: string; classification: string }[]> = {
  HBB: [
    { id: "15447", name: "NM_000518.5(HBB):c.92+5G>C", classification: "Pathogenic" },
    { id: "15402", name: "NM_000518.5(HBB):c.118C>T (p.Gln40Ter)", classification: "Pathogenic" },
    { id: "15333", name: "NM_000518.5(HBB):c.20A>T (p.Glu7Val)", classification: "Pathogenic" },
    { id: "15584", name: "NM_000518.4(HBB):c.371C>A (p.Thr124Asn)", classification: "Uncertain significance" },
  ],
  GJB2: [{ id: "17004", name: "NM_004004.6(GJB2):c.35del (p.Gly12fs)", classification: "Pathogenic" }],
};

const obj = (properties: Record<string, unknown>, required: string[]): ToolSpec["input_schema"] => ({ type: "object", properties, required, additionalProperties: false });

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: "search_content",
    description: "Search the approved Merros content library (conditions, carrier status, what a result means, limits of testing, options). Call this for every question. Returns passages with ids to cite.",
    input_schema: obj({ query: { type: "string", description: "Search words in the person's language, including the condition or gene if mentioned" } }, ["query"]),
  },
  {
    name: "carrier_outcomes",
    description: "Exact chances for each pregnancy for ONE gene, from the risk engine. Call whenever the question is about chance, risk, percentages or 'will our baby'. Never state a chance without calling this or couple_combined_risk.",
    input_schema: obj({ partner_a_carrier: { type: "boolean" }, partner_b_carrier: { type: "boolean" } }, ["partner_a_carrier", "partner_b_carrier"]),
  },
  {
    name: "couple_combined_risk",
    description: "Exact combined chance for each pregnancy when both partners carry changes in the SAME genes, for 1 to 3 shared genes.",
    input_schema: obj({ shared_genes: { type: "integer", enum: [1, 2, 3] } }, ["shared_genes"]),
  },
  {
    name: "my_result",
    description: "The person's own screening findings (gene, classification, condition), with no identifying details. Call when they ask about 'my result', 'my gene' or 'am I'.",
    input_schema: obj({}, []),
  },
  {
    name: "explain_classification",
    description: "Plain language meaning of a variant classification.",
    input_schema: obj({ classification: { type: "string", enum: ["pathogenic", "likely_pathogenic", "vus", "likely_benign", "benign"] } }, ["classification"]),
  },
  {
    name: "clinvar_lookup",
    description: "Reference ClinVar records for a gene (local reference table).",
    input_schema: obj({ gene: { type: "string" } }, ["gene"]),
  },
];

export function createToolbox(ctx: CopilotContext) {
  const sheet: FactSheet = { passages: [], numbers: [], notes: [] };
  const ar = ctx.locale === "ar";
  const addPassages = (ps: FactSheet["passages"]) => {
    for (const p of ps) if (!sheet.passages.some((x) => x.id === p.id)) sheet.passages.push(p);
  };
  const addNumber = (label: string, value: string) => {
    if (!sheet.numbers.some((n) => n.label === label)) sheet.numbers.push({ label, value });
  };

  function run(call: ToolCall): string {
    const input = call.input ?? {};
    switch (call.name) {
      case "search_content": {
        const found = search(String(input.query ?? ""), ctx.locale, ctx.level);
        addPassages(found);
        return JSON.stringify(found.map(({ id, title, text }) => ({ id, title, text })));
      }
      case "carrier_outcomes": {
        const a = input.partner_a_carrier === true;
        const b = input.partner_b_carrier === true;
        const o = perPregnancy(a ? HALF : ZERO, b ? HALF : ZERO);
        const who = a && b ? (ar ? "كلا الشريكين حامل للجين نفسه" : "both partners carry the same gene") : a || b ? (ar ? "شريك واحد فقط حامل" : "only one partner is a carrier") : ar ? "لا أحد من الشريكين حامل" : "neither partner is a carrier";
        addNumber(ar ? `احتمال أن يكون الطفل مصاباً في كل حمل (${who})` : `chance a baby is affected, each pregnancy (${who})`, `${toPercentString(o.affected)}%`);
        addNumber(ar ? `احتمال أن يكون الطفل حاملاً سليماً (${who})` : `chance a baby is a healthy carrier (${who})`, `${toPercentString(o.carrier)}%`);
        addNumber(ar ? `احتمال ألا يكون الطفل حاملاً ولا مصاباً (${who})` : `chance a baby is neither (${who})`, `${toPercentString(o.nonCarrier)}%`);
        sheet.notes.push(ar ? "كل حمل مستقل عن غيره؛ الاحتمال هو نفسه في كل مرة." : "Each pregnancy is independent; the chance is the same every time.");
        return JSON.stringify({ affected: `${toPercentString(o.affected)}%`, carrier: `${toPercentString(o.carrier)}%`, neither: `${toPercentString(o.nonCarrier)}%`, independent_each_pregnancy: true });
      }
      case "couple_combined_risk": {
        const n = Math.min(3, Math.max(1, Number(input.shared_genes) || 1));
        const one = perPregnancy(HALF, HALF).affected;
        const combined = combineAffected(Array.from({ length: n }, () => one));
        addNumber(ar ? "احتمال الإصابة لكل جين مشترك في كل حمل" : "chance per shared gene, each pregnancy", `${toPercentString(one)}%`);
        addNumber(ar ? `الاحتمال المجمّع لحالة واحدة على الأقل مع ${n} جينات مشتركة` : `combined chance of at least one condition with ${n} shared gene${n > 1 ? "s" : ""}`, `${toPercentString(combined)}%`);
        return JSON.stringify({ shared_genes: n, per_gene: `${toPercentString(one)}%`, combined: `${toPercentString(combined)}%` });
      }
      case "my_result": {
        if (!ctx.ownFindings) {
          sheet.notes.push(ar ? "لا توجد نتيجة متاحة لهذا الشخص (لم تُفتح أو لا توجد)." : "No result is available for this person (not opened, or none exists).");
          return JSON.stringify({ available: false });
        }
        const line = ctx.ownFindings.length
          ? ctx.ownFindings.map((f) => `${f.gene}: ${f.classification} (${f.condition})`).join("; ")
          : ar ? "لم يُعثر على تغيرات في الجينات المفحوصة." : "No changes were found on the tested genes.";
        sheet.notes.push((ar ? "نتيجة الشخص: " : "The person's result: ") + line);
        return JSON.stringify({ available: true, findings: ctx.ownFindings });
      }
      case "explain_classification": {
        const cls = String(input.classification ?? "");
        const text = ACMG_GUIDE.classes[cls];
        if (!text) return JSON.stringify({ error: "unknown classification" });
        addPassages([{ id: `${ACMG_GUIDE.id}#${cls}`, title: pick(ACMG_GUIDE.title, ctx.locale), text: pick(text, ctx.locale), label: "education" }]);
        return JSON.stringify({ id: `${ACMG_GUIDE.id}#${cls}`, text: pick(text, ctx.locale) });
      }
      case "clinvar_lookup": {
        const rows = CLINVAR_LOCAL[String(input.gene ?? "").toUpperCase()] ?? [];
        if (rows.length) sheet.notes.push(`ClinVar (${String(input.gene).toUpperCase()}): ` + rows.map((r) => `VCV${r.id.padStart(9, "0")} ${r.classification}`).join("; "));
        return JSON.stringify(rows);
      }
      default:
        return JSON.stringify({ error: `unknown tool ${call.name}` });
    }
  }
  return { sheet, run };
}
