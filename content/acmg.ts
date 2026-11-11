/** Plain language guide to variant classification (ACMG/AMP framework). Pending accredited review. */
import type { Bi, ContentMeta } from "./types";

export const ACMG_GUIDE: ContentMeta & { title: Bi; classes: Record<string, Bi> } = {
  id: "explainer.acmg",
  version: 1,
  label: "education",
  source: "curated",
  reviewStatus: "pending_accredited_review",
  sources: [{ title: "ACMG/AMP standards and guidelines for the interpretation of sequence variants (Richards et al., 2015)", url: "https://pubmed.ncbi.nlm.nih.gov/25741868/" }],
  title: { en: "How labs classify a gene change", ar: "كيف تصنّف المختبرات التغيّر الجيني" },
  classes: {
    pathogenic: {
      en: "Pathogenic means there is strong evidence that this gene change can cause the condition when a child inherits it from both parents.",
      ar: "ممرِض يعني وجود دليل قوي على أن هذا التغيّر الجيني قد يسبب الحالة عندما يرثه الطفل من كلا الوالدين.",
    },
    likely_pathogenic: {
      en: "Likely pathogenic means the evidence points strongly towards the change being disease causing, though it is not yet certain. It is treated like pathogenic for carrier screening.",
      ar: "محتمل الإمراض يعني أن الأدلة تشير بقوة إلى أن التغيّر مسبب للمرض، وإن لم يكن ذلك مؤكداً بعد. ويُعامل كالممرِض في فحص الحاملين.",
    },
    vus: {
      en: "A variant of uncertain significance (VUS) is a change that science cannot yet classify. It is not counted in any risk number. Most are later found to be harmless, and classifications are reviewed as evidence grows.",
      ar: "المتغير غير مؤكد الأهمية هو تغيّر لا يستطيع العلم تصنيفه بعد. لا يُحتسب في أي رقم احتمالي. يتبيّن لاحقاً أن معظمها غير ضار، وتُراجع التصنيفات مع تزايد الأدلة.",
    },
    likely_benign: {
      en: "Likely benign means the evidence suggests the change is harmless.",
      ar: "محتمل أنه حميد يعني أن الأدلة تشير إلى أن التغيّر غير ضار.",
    },
    benign: {
      en: "Benign means the change is a normal difference between people and does not cause the condition.",
      ar: "حميد يعني أن التغيّر اختلاف طبيعي بين الناس ولا يسبب الحالة.",
    },
  },
};
