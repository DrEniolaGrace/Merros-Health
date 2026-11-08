/** Plain language consent wording (SPEC 4.1). Each says who, what, to whom, why and for how long. */
import type { ConsentPurpose } from "@/lib/consent/purposes";
import type { Bi } from "./types";

export const CONSENT_TEXT: Record<ConsentPurpose, { title: Bi; body: Bi }> = {
  view_own_result: {
    title: { en: "Show me my result", ar: "اعرض لي نتيجتي" },
    body: {
      en: "Meros will open the result your screening lab sent and explain it to you. Only you will see it. You can choose not to know.",
      ar: "سيفتح ميروس النتيجة التي أرسلها مختبر الفحص ويشرحها لك. لن يراها أحد غيرك. ويمكنك أن تختار عدم المعرفة.",
    },
  },
  couple_comparison: {
    title: { en: "Compare with my partner, privately", ar: "قارن مع شريكي بخصوصية" },
    body: {
      en: "If your partner also agrees, you will both see only the genes you share. Neither of you sees the rest of the other's result. Lasts 90 days.",
      ar: "إذا وافق شريكك أيضاً، سيرى كلاكما فقط الجينات المشتركة بينكما. ولن يرى أي منكما بقية نتيجة الآخر. صالحة لمدة 90 يوماً.",
    },
  },
  counsellor_access: {
    title: { en: "Let my genetic counsellor see my result", ar: "اسمح لمستشاري الوراثي برؤية نتيجتي" },
    body: {
      en: "A named, licensed genetic counsellor can see your result and your progress here to prepare for your session. Lasts 90 days.",
      ar: "يمكن لمستشار وراثي مرخّص ومُسمّى رؤية نتيجتك وتقدّمك هنا للاستعداد لجلستك. صالحة لمدة 90 يوماً.",
    },
  },
  aggregate_analytics: {
    title: { en: "Help improve care, anonymously", ar: "ساعد في تحسين الرعاية دون الكشف عن هويتك" },
    body: {
      en: "Anonymous, privacy protected statistics help the health system plan services. Nobody can identify you from them. Lasts one year.",
      ar: "تساعد إحصاءات مجهولة الهوية ومحمية الخصوصية النظام الصحي في تخطيط الخدمات. ولا يمكن لأحد التعرف عليك منها. صالحة لمدة سنة.",
    },
  },
  reclassification_recontact: {
    title: { en: "Tell me if science changes my result", ar: "أبلغني إذا غيّر العلم نتيجتي" },
    body: {
      en: "If a variant in your result is reclassified, your counsellor will contact you. You have the right not to be told. Lasts one year.",
      ar: "إذا أُعيد تصنيف متغير في نتيجتك، سيتواصل معك مستشارك. ومن حقك ألا تُبلَّغ. صالحة لمدة سنة.",
    },
  },
};
