/**
 * Retrieval over the curated content library. Every passage is approved content with an id, so
 * answers can cite it. Lexical scoring with a small bilingual keyword map is enough for this
 * library size; pgvector embeddings are the production upgrade.
 */
import { CONDITIONS } from "@/content/conditions";
import { CARRIER_MEANING, LIMITS, NOT_A_DIAGNOSIS, NO_VARIANTS } from "@/content/explainer";
import { OPTIONS } from "@/content/options";
import { TEACHBACK } from "@/content/teachback";
import { ACMG_GUIDE } from "@/content/acmg";
import { pick } from "@/content/types";
import type { Level, Locale, Passage } from "./types";

interface Indexed extends Passage {
  keywords: string;
}

const KEYWORDS: Record<string, string> = {
  "beta-thalassaemia": "thalassemia thalassaemia beta hbb blood anaemia anemia transfusion ثلاسيميا الثلاسيميا بيتا دم فقر",
  "sickle-cell": "sickle cell hbs hbb pain crisis منجلية المنجلية الخلايا أنيميا",
  sma: "sma spinal muscular atrophy smn1 muscle weakness ضمور العضلات الشوكي",
  "gjb2-hearing-loss": "gjb2 hearing loss deaf deafness cochlear السمع الصمم فقدان",
  "cystic-fibrosis": "cystic fibrosis cftr lungs mucus التليف الكيسي",
  "alpha-thalassaemia": "alpha thalassemia thalassaemia hba1 hba2 hbh ثلاسيميا ألفا",
};

export function buildIndex(locale: Locale, level: Level): Indexed[] {
  const out: Indexed[] = [];
  for (const c of CONDITIONS) {
    const kw = `${KEYWORDS[c.conditionId] ?? ""} ${c.gene} ${c.name.en} ${c.name.ar}`;
    const href = `/learn/${c.conditionId}`;
    const title = pick(c.name, locale);
    out.push({ id: c.id, title, text: pick(c.summary[level], locale), label: "education", href, keywords: `${kw} what is about ما هو ما هي` });
    out.push({ id: `${c.id}#carriers`, title, text: pick(c.carriers, locale), label: "education", href, keywords: `${kw} carrier carriers trait healthy symptoms حامل حاملة سمة أعراض` });
    out.push({ id: `${c.id}#treatment`, title, text: pick(c.treatment, locale), label: "education", href, keywords: `${kw} treatment treat cure therapy medicine care علاج دواء شفاء رعاية` });
    out.push({ id: `${c.id}#life`, title, text: pick(c.life, locale), label: "education", href, keywords: `${kw} life living quality future outlook حياة العيش مستقبل` });
  }
  out.push({
    id: CARRIER_MEANING.id, title: locale === "ar" ? "معنى أن تكون حاملاً" : "What being a carrier means", text: pick(CARRIER_MEANING.body[level], locale), label: "education",
    keywords: "carrier mean meaning am i sick ill healthy one copy حامل حاملة معنى يعني مريض مريضة سليم نسخة",
  });
  out.push({
    id: NOT_A_DIAGNOSIS.id, title: pick(NOT_A_DIAGNOSIS.title, locale), text: pick(NOT_A_DIAGNOSIS.body, locale), label: "education",
    keywords: "diagnosis certain sure definitely will my baby have guarantee chance risk تشخيص مؤكد أكيد هل سيصاب طفلي احتمال",
  });
  LIMITS.items.forEach((it, i) =>
    out.push({
      id: `${LIMITS.id}#${i}`, title: pick(it.title, locale), text: pick(it.body, locale), label: "education",
      keywords: ["test cover miss panel not tested limits لا يغطي الفحص حدود", "negative normal no changes residual zero risk safe سليمة المتبقي صفر", "vus uncertain significance variant unknown reclassified غير مؤكد الأهمية متغير", "cousin cousins related relatives consanguinity consanguineous أقارب ابن عم ابنة عم قرابة"][i] ?? "",
    }),
  );
  out.push({
    id: NO_VARIANTS.id, title: locale === "ar" ? "نتيجة دون تغيرات" : "A result with no changes", text: pick(NO_VARIANTS.body[level], locale), label: "education",
    keywords: "no variants negative normal clear result nothing found لا توجد تغيرات سليمة",
  });
  const chance = TEACHBACK.find((q) => q.questionId === "chance")!;
  out.push({
    id: chance.id, title: locale === "ar" ? "الاحتمال في كل حمل" : "The chance in each pregnancy", text: pick(chance.explanations[0].text, locale), label: "education",
    keywords: "chance risk percent percentage each pregnancy 25 1 in 4 every child both carriers second baby احتمال نسبة كل حمل طفل ثاني كلانا حامل",
  });
  for (const [cls, text] of Object.entries(ACMG_GUIDE.classes)) {
    out.push({
      id: `${ACMG_GUIDE.id}#${cls}`, title: pick(ACMG_GUIDE.title, locale), text: pick(text, locale), label: "education",
      keywords: `${cls.replace("_", " ")} classification classify acmg pathogenic benign vus uncertain تصنيف ممرض حميد غير مؤكد`,
    });
  }
  for (const o of OPTIONS) {
    out.push({
      id: o.id, title: pick(o.title, locale), href: "/options", label: "decision_support",
      text: `${pick(o.involves, locale)} ${pick(o.timing, locale)} ${pick(o.availability, locale)}`,
      keywords: `options option choices choice what can we do ${o.title.en} ${o.title.ar} ${o.optionId.replace(/-/g, " ")} ivf pgt prenatal testing amniocentesis adoption kafala donor خيارات خيار ماذا يمكن أطفال الأنابيب فحص الأجنة الحمل كفالة`,
    });
  }
  return out;
}

const STOP = new Set("the a an is are of to and or in on for with my me i we our you it this that what how do does can will if be at as by from have has في من على إلى عن هل ما أن هذا هذه هو هي أو و لا أنا نحن لي".split(" "));

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // Arabic diacritics and tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

export function tokens(s: string): string[] {
  return normalise(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) =>
      /^[؀-ۿ]/.test(t)
        ? // Arabic: drop the definite article and, on longer words, attached pronouns ("خياراتنا" -> "خيارات").
          t.replace(/^(ال|وال|بال|لل)/, "").replace(/^(.{4,}?)(نا|كما|هما|كم|هم|ها)$/, "$1")
        : t.replace(/(s|es)$/, ""),
    );
}

/** Top passages for a query. Deterministic; ties break by library order. */
export function search(query: string, locale: Locale, level: Level, limit = 4): Passage[] {
  const q = new Set(tokens(query));
  if (q.size === 0) return [];
  const scored = buildIndex(locale, level).map((p, i) => {
    const kw = new Set(tokens(p.keywords));
    const body = new Set(tokens(`${p.title} ${p.text}`));
    let score = 0;
    for (const t of q) score += (kw.has(t) ? 2 : 0) + (body.has(t) ? 1 : 0);
    return { p, score, i };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map(({ p }) => ({ id: p.id, title: p.title, text: p.text, label: p.label, href: p.href }));
}
