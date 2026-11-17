/**
 * Options Explorer (SPEC 4.5). Every clinically appropriate option with equal weight, never ranked
 * or labelled recommended. Order is shuffled per person. Decision support, pending review.
 */
import type { Bi, ContentMeta } from "./types";

export interface OptionCard extends ContentMeta {
  optionId: string;
  icon: "house" | "stethoscope" | "flask" | "handshake" | "heart" | "leaf" | "clock";
  title: Bi;
  involves: Bi;
  timing: Bi;
  availability: Bi;
  questions: Bi[];
}

const meta = (id: string): ContentMeta => ({
  id: `option.${id}`, version: 1, label: "decision_support", source: "curated", reviewStatus: "pending_accredited_review", sources: [],
});

export const OPTIONS: OptionCard[] = [
  {
    ...meta("no-change"), optionId: "no-change", icon: "house",
    title: { en: "Continue with plans as they are", ar: "المضي في الخطط كما هي" },
    involves: { en: "Going ahead with marriage and pregnancy plans without additional testing or procedures, knowing the chance involved.", ar: "المضي في خطط الزواج والحمل دون فحوص أو إجراءات إضافية، مع معرفة الاحتمال القائم." },
    timing: { en: "Any time.", ar: "في أي وقت." },
    availability: { en: "Always available. Newborn screening is offered after birth.", ar: "متاح دائماً. ويُقدَّم فحص حديثي الولادة بعد الولادة." },
    questions: [
      { en: "What care would be available if a child is affected?", ar: "ما الرعاية المتاحة إذا كان الطفل مصاباً؟" },
      { en: "How is newborn screening done here?", ar: "كيف يُجرى فحص حديثي الولادة هنا؟" },
    ],
  },
  {
    ...meta("prenatal-testing"), optionId: "prenatal-testing", icon: "stethoscope",
    title: { en: "Testing during pregnancy", ar: "الفحص أثناء الحمل" },
    involves: { en: "Tests such as chorionic villus sampling or amniocentesis can show whether a pregnancy is affected. Each has a small risk of miscarriage.", ar: "فحوص مثل أخذ عينة من الزغابات المشيمية أو بزل السائل الأمنيوسي يمكن أن تُظهر إن كان الحمل مصاباً. ولكل منها احتمال صغير للإجهاض." },
    timing: { en: "Usually from around 11 weeks of pregnancy. Timing is important, so plan early with a counsellor.", ar: "عادةً من نحو الأسبوع 11 من الحمل. التوقيت مهم، لذا خطّط مبكراً مع المستشار." },
    availability: { en: "Offered by maternal fetal medicine services. Your genetic counsellor can tell you how and when.", ar: "تقدمه خدمات طب الأم والجنين. ويمكن لمستشارك الوراثي أن يخبرك بالطريقة والتوقيت." },
    questions: [
      { en: "Which test fits our situation, and when?", ar: "أي فحص يناسب وضعنا، ومتى؟" },
      { en: "What would we do with the result?", ar: "ماذا سنفعل بالنتيجة؟" },
    ],
  },
  {
    ...meta("ivf-pgtm"), optionId: "ivf-pgtm", icon: "flask",
    title: { en: "IVF with embryo testing (PGT-M)", ar: "أطفال الأنابيب مع فحص الأجنة (PGT-M)" },
    involves: { en: "Embryos are created through IVF and tested for the specific condition before one is transferred.", ar: "تُكوَّن الأجنة عبر أطفال الأنابيب وتُفحص للحالة المحددة قبل نقل أحدها." },
    timing: { en: "Before pregnancy. Preparing the test for a couple's specific variants can take several weeks.", ar: "قبل الحمل. قد يستغرق إعداد الفحص للمتغيرات الخاصة بالزوجين عدة أسابيع." },
    availability: { en: "Offered by licensed IVF clinics in Abu Dhabi. Success rates vary.", ar: "تقدمه عيادات أطفال الأنابيب المرخّصة في أبوظبي. وتختلف معدلات النجاح." },
    questions: [
      { en: "What are the success rates for couples like us?", ar: "ما معدلات النجاح لأزواج في وضعنا؟" },
      { en: "What does the process involve physically?", ar: "ماذا تتضمن العملية جسدياً؟" },
    ],
  },
  {
    ...meta("donor"), optionId: "donor", icon: "handshake",
    title: { en: "Donor eggs or sperm, where permitted", ar: "بويضات أو حيوانات منوية من متبرع، حيثما يُسمح" },
    involves: { en: "Using donated eggs or sperm from someone who is not a carrier for the same condition.", ar: "استخدام بويضات أو حيوانات منوية من متبرع ليس حاملاً للحالة نفسها." },
    timing: { en: "Before pregnancy.", ar: "قبل الحمل." },
    availability: { en: "Depends on national law and personal beliefs. In the UAE this is restricted by law; a counsellor can explain what applies.", ar: "يعتمد على القانون الوطني والمعتقدات الشخصية. وهو مقيّد قانونياً في الإمارات؛ ويمكن للمستشار شرح ما ينطبق." },
    questions: [{ en: "What does the law allow for us?", ar: "ماذا يسمح القانون لنا؟" }],
  },
  {
    ...meta("fostering"), optionId: "fostering", icon: "heart",
    title: { en: "Fostering or kafala", ar: "الاحتضان أو الكفالة" },
    involves: { en: "Caring for a child through fostering or kafala (sponsorship), following local law and guidance.", ar: "رعاية طفل عبر الاحتضان أو الكفالة، وفق القانون والإرشادات المحلية." },
    timing: { en: "Any time.", ar: "في أي وقت." },
    availability: { en: "Through official social services. Your genetic counsellor can tell you where to start.", ar: "عبر جهات الخدمات الاجتماعية الرسمية. ويمكن لمستشارك الوراثي أن يخبرك من أين تبدأ." },
    questions: [{ en: "Who can we speak to about fostering or kafala?", ar: "مع من يمكننا التحدث عن الاحتضان أو الكفالة؟" }],
  },
  {
    ...meta("no-biological-children"), optionId: "no-biological-children", icon: "leaf",
    title: { en: "Not having biological children", ar: "عدم إنجاب أطفال بيولوجيين" },
    involves: { en: "Some people choose a life without biological children. This is a valid choice.", ar: "يختار بعض الناس حياة دون أطفال بيولوجيين. وهذا خيار مشروع." },
    timing: { en: "Any time.", ar: "في أي وقت." },
    availability: { en: "Always available.", ar: "متاح دائماً." },
    questions: [{ en: "Where can we find support for this decision?", ar: "أين نجد الدعم لهذا القرار؟" }],
  },
  {
    ...meta("postpone"), optionId: "postpone", icon: "clock",
    title: { en: "Take time, decide after counselling", ar: "التمهّل والقرار بعد الاستشارة" },
    involves: { en: "There is no need to decide now. You can talk with a genetic counsellor first and take the time you need.", ar: "لا داعي للقرار الآن. يمكنك التحدث مع مستشار وراثي أولاً وأخذ الوقت الذي تحتاجه." },
    timing: { en: "Now.", ar: "الآن." },
    availability: { en: "Genetic counsellors are available in person, by video or phone.", ar: "المستشارون الوراثيون متاحون حضورياً أو عبر الفيديو أو الهاتف." },
    questions: [{ en: "What should we prepare before our session?", ar: "ماذا نُحضّر قبل جلستنا؟" }],
  },
];

/** Deterministic Fisher Yates shuffle from a per person seed, so no order implies a ranking. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  // mulberry32: well mixed even for small, sequential seeds.
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
