/**
 * Values Compass (SPEC 4.6) and Distress Check (SPEC 4.12) content. Decision support, pending
 * accredited review. Based on the Ottawa Decision Support Framework: the person states what
 * matters to them, and the app shows how each option relates to that, without choosing.
 *
 * The SURE test items follow Légaré et al. (2010), "Are you SURE? Assessing patient decisional
 * conflict with a 4 item screening test", Canadian Family Physician 56(8). The Arabic wording is
 * a working translation, not a validated Arabic version.
 * The single item Distress Thermometer (0 to 10) follows the NCCN Distress Thermometer.
 */
import type { Bi } from "./types";

export const VALUE_KEYS = ["faith", "family", "biological", "procedures", "certainty", "cost", "time"] as const;
export type ValueKey = (typeof VALUE_KEYS)[number];

export const VALUES: Record<ValueKey, { title: Bi; body: Bi }> = {
  faith: {
    title: { en: "My faith", ar: "إيماني" },
    body: { en: "Choosing in a way that is true to my beliefs.", ar: "أن أختار بما يوافق معتقداتي." },
  },
  family: {
    title: { en: "My family's expectations", ar: "توقعات عائلتي" },
    body: { en: "What my family hopes for, and keeping harmony with them.", ar: "ما تأمله عائلتي، والحفاظ على الوفاق معها." },
  },
  biological: {
    title: { en: "Having biological children", ar: "إنجاب أطفال من صلبنا" },
    body: { en: "Having children who are genetically ours.", ar: "أن يكون أطفالنا منا وراثياً." },
  },
  procedures: {
    title: { en: "Avoiding medical procedures", ar: "تجنّب الإجراءات الطبية" },
    body: { en: "Keeping tests, medicines and procedures to a minimum.", ar: "تقليل الفحوص والأدوية والإجراءات قدر الإمكان." },
  },
  certainty: {
    title: { en: "Knowing as much as possible in advance", ar: "معرفة أكبر قدر ممكن مسبقاً" },
    body: { en: "Having more certainty before or during a pregnancy.", ar: "قدر أكبر من اليقين قبل الحمل أو أثناءه." },
  },
  cost: {
    title: { en: "Keeping costs manageable", ar: "أن تبقى التكاليف معقولة" },
    body: { en: "Not taking on costs that would be hard for us.", ar: "ألا نتحمل تكاليف تثقل علينا." },
  },
  time: {
    title: { en: "Not waiting a long time", ar: "ألا ننتظر طويلاً" },
    body: { en: "Being able to move forward soon.", ar: "أن نستطيع المضي قريباً." },
  },
};

/** How much something matters, 0 to 4. Nothing is pre selected. */
export const IMPORTANCE: Bi[] = [
  { en: "Not important", ar: "غير مهم" },
  { en: "A little", ar: "قليلاً" },
  { en: "Somewhat", ar: "إلى حد ما" },
  { en: "Very", ar: "مهم جداً" },
  { en: "Essential", ar: "أساسي" },
];

/** A value counts as "important to you" from this rating upward. */
export const IMPORTANT_FROM = 3;

/**
 * How an option usually relates to a value: "fits", "tension" or "depends". Deliberately coarse.
 * Faith and family expectations are always "depends": only the person, and those they trust,
 * can say what their faith or family asks. Pending accredited review.
 */
export type Relation = "fits" | "tension" | "depends";

export const OPTION_IDS = ["no-change", "prenatal-testing", "ivf-pgtm", "donor", "fostering", "no-biological-children", "postpone"] as const;
export type OptionId = (typeof OPTION_IDS)[number];

const row = (biological: Relation, procedures: Relation, certainty: Relation, cost: Relation, time: Relation): Record<ValueKey, Relation> => ({
  faith: "depends",
  family: "depends",
  biological,
  procedures,
  certainty,
  cost,
  time,
});

export const OPTION_FIT: Record<OptionId, Record<ValueKey, Relation>> = {
  "no-change": row("fits", "fits", "tension", "fits", "fits"),
  "prenatal-testing": row("fits", "tension", "fits", "depends", "fits"),
  "ivf-pgtm": row("fits", "tension", "fits", "tension", "tension"),
  donor: row("depends", "tension", "fits", "tension", "tension"),
  fostering: row("tension", "fits", "depends", "depends", "tension"),
  "no-biological-children": row("tension", "fits", "depends", "fits", "fits"),
  postpone: row("depends", "fits", "tension", "fits", "tension"),
};

export const SURE_ITEMS: { key: "sure" | "understand" | "riskBenefit" | "encouragement"; text: Bi }[] = [
  { key: "sure", text: { en: "Do you feel sure about the best choice for you?", ar: "هل تشعر بأنك متأكد مما هو أنسب لك؟" } },
  { key: "understand", text: { en: "Do you know the benefits and risks of each option?", ar: "هل تعرف فوائد كل خيار ومخاطره؟" } },
  { key: "riskBenefit", text: { en: "Are you clear about which benefits and risks matter most to you?", ar: "هل يتضح لك أي الفوائد والمخاطر أهم عندك؟" } },
  { key: "encouragement", text: { en: "Do you have enough support and advice to make a choice?", ar: "هل لديك ما يكفي من الدعم والمشورة لتختار؟" } },
];

/** Calm support content shown after the Distress Check, by band. Education, pending review. */
export const DISTRESS_SUPPORT: Record<"low" | "moderate" | "high", { title: Bi; body: Bi; tips: Bi[] }> = {
  low: {
    title: { en: "Thank you for checking in", ar: "شكراً لأنك شاركتنا شعورك" },
    body: {
      en: "It sounds as though you are coping with this at the moment. Feelings can change, and you can check in again any time.",
      ar: "يبدو أنك تتعامل مع الأمر جيداً الآن. قد تتغير المشاعر، ويمكنك أن تعود إلى هذا في أي وقت.",
    },
    tips: [
      { en: "Go at your own pace. Nothing here needs a decision today.", ar: "سِر بالوتيرة التي تناسبك. لا شيء هنا يحتاج قراراً اليوم." },
      { en: "A genetic counsellor is available if questions come up later.", ar: "المستشار الوراثي متاح إذا ظهرت أسئلة لاحقاً." },
    ],
  },
  moderate: {
    title: { en: "It makes sense to feel this way", ar: "من الطبيعي أن تشعر بهذا" },
    body: {
      en: "Many people feel unsettled after a genetic result. Being a carrier is common, and carriers are usually healthy. You do not have to work through this alone.",
      ar: "يشعر كثيرون بعدم الارتياح بعد نتيجة وراثية. أن تكون حاملاً أمر شائع، والحاملون أصحاء في العادة. لست مضطراً لمواجهة هذا وحدك.",
    },
    tips: [
      { en: "Take a break from reading if it feels like too much.", ar: "خذ استراحة من القراءة إذا شعرت أن الأمر أكثر مما تحتمل." },
      { en: "Talk with someone you trust, when you feel ready.", ar: "تحدث مع شخص تثق به حين تشعر بأنك مستعد." },
      { en: "Write down what worries you most, to bring to a counsellor.", ar: "اكتب أكثر ما يقلقك لتعرضه على المستشار." },
    ],
  },
  high: {
    title: { en: "You do not have to carry this alone", ar: "لست مضطراً لحمل هذا وحدك" },
    body: {
      en: "What you are feeling is real, and support is available this week. A genetic counsellor or a psychologist can call you back. You choose which.",
      ar: "ما تشعر به حقيقي، والدعم متاح هذا الأسبوع. يمكن لمستشار وراثي أو أخصائي نفسي أن يتصل بك. والاختيار لك.",
    },
    tips: [
      { en: "You can stop reading and come back later. Your information stays private.", ar: "يمكنك التوقف عن القراءة والعودة لاحقاً. تبقى معلوماتك خاصة." },
      { en: "A result describes a chance. It is not a diagnosis and not a verdict on your future.", ar: "النتيجة تصف احتمالاً. ليست تشخيصاً ولا حكماً على مستقبلك." },
    ],
  },
};

/** Crisis contacts are placeholders. They must be verified and filled in before any release. */
export const CRISIS_PLACEHOLDERS: Bi[] = [
  { en: "Emergency services: number to be verified before release", ar: "خدمات الطوارئ: يُتحقق من الرقم قبل الإصدار" },
  { en: "Mental health support line: number to be verified before release", ar: "خط دعم الصحة النفسية: يُتحقق من الرقم قبل الإصدار" },
];
