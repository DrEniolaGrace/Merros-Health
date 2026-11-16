/** Plain, calm wording for each escalation reason (SPEC 4.8). Never alarming, never directive. */
import type { EscalationCode } from "@/lib/escalation/rules";
import type { Bi } from "./types";

export const ESCALATION_TEXT: Record<EscalationCode, Bi> = {
  shared_pathogenic_gene: {
    en: "You and your partner have a shared carrier result: you both carry a change in the same gene. In results counselling a physician or genetic counsellor goes through it with each of you, and then with you together if you both agree, to help you plan.",
    ar: "لديك وشريكك نتيجة حمل مشتركة: تحملان تغيراً في الجين نفسه. في جلسة شرح النتائج يراجعها معكما طبيب أو مستشار وراثي، كلٌّ على حدة ثم معاً إذا وافقتما، لمساعدتكما على التخطيط.",
  },
  vus_present: {
    en: "Your result includes a variant of uncertain significance. A counsellor can explain it and keep you informed if it changes.",
    ar: "تتضمن نتيجتك متغيراً غير مؤكد الأهمية. يمكن للمستشار شرحه وإبلاغك إذا تغيّر تصنيفه.",
  },
  significant_personal_finding: {
    en: "Your result includes a finding that is best explained in person by a clinical geneticist or genetic counsellor.",
    ar: "تتضمن نتيجتك معلومة يُفضَّل أن يشرحها لك مباشرة استشاري وراثة سريرية أو مستشار وراثي.",
  },
  pregnant_or_trying: {
    en: "Because you are pregnant or planning a pregnancy, timing matters. A counsellor can help you plan.",
    ar: "لأنكِ حامل أو تخططين للحمل، فالتوقيت مهم. يمكن للمستشار مساعدتك في التخطيط.",
  },
  high_distress: {
    en: "You told us this feels hard right now. A counsellor or psychologist can call you this week.",
    ar: "أخبرتنا أن الأمر صعب عليك الآن. يمكن لمستشار أو أخصائي نفسي الاتصال بك هذا الأسبوع.",
  },
  teachback_failed_twice: {
    en: "Some parts may be easier to talk through with a person. A counsellor can explain them in a different way.",
    ar: "قد يكون من الأسهل مناقشة بعض الأجزاء مع شخص. يمكن للمستشار شرحها بطريقة مختلفة.",
  },
  medical_advice_requested: {
    en: "You asked for medical advice. Only a qualified clinician can give that, so we can book you a counsellor.",
    ar: "طلبت مشورة طبية. لا يقدّمها إلا مختص مؤهل، لذا يمكننا حجز موعد لك مع مستشار.",
  },
  safety_verifier_block: {
    en: "Your question is best answered by a qualified person.",
    ar: "من الأفضل أن يجيب عن سؤالك شخص مؤهل.",
  },
  variant_reclassified: {
    en: "The scientific understanding of a variant in your result has changed. Your counsellor will talk you through it.",
    ar: "تغيّر الفهم العلمي لمتغير في نتيجتك. سيشرح لك مستشارك ذلك.",
  },
  risk_beyond_panel_result: {
    en: "An additional analysis is ready for your counsellor to discuss with you.",
    ar: "يوجد تحليل إضافي جاهز ليناقشه مستشارك معك.",
  },
};

export const SEVERITY_TEXT: Record<"urgent" | "high" | "routine", Bi> = {
  urgent: { en: "This week", ar: "هذا الأسبوع" },
  high: { en: "Soon", ar: "قريباً" },
  routine: { en: "When you are ready", ar: "عندما تكون مستعداً" },
};
