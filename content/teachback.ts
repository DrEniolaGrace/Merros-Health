/**
 * Teach Back questions (SPEC 4.4). Each question has ordered explanation variants: the standard
 * one, then a new analogy, then simpler words with a visual cue. A wrong answer shows the next one.
 */
import type { Bi, ContentMeta } from "./types";

export interface TeachBackQuestion extends ContentMeta {
  questionId: string;
  prompt: Bi;
  options: { id: string; text: Bi }[];
  correct: string;
  explanations: { kind: "standard" | "analogy" | "simpler"; text: Bi }[];
}

const meta = (id: string): ContentMeta => ({
  id: `teachback.${id}`, version: 1, label: "education", source: "curated", reviewStatus: "pending_accredited_review", sources: [],
});

export const TEACHBACK: TeachBackQuestion[] = [
  {
    ...meta("carrier"),
    questionId: "carrier",
    prompt: { en: "In your own words, what does being a carrier mean?", ar: "بكلماتك أنت، ماذا يعني أن تكون حاملاً؟" },
    options: [
      { id: "a", text: { en: "I have the condition", ar: "أنا مصاب بالحالة" } },
      { id: "b", text: { en: "I have one changed copy of a gene and I am usually healthy", ar: "لدي نسخة متغيرة واحدة من الجين وأنا عادةً بصحة جيدة" } },
      { id: "c", text: { en: "My children will definitely have the condition", ar: "سيُصاب أطفالي بالحالة حتماً" } },
    ],
    correct: "b",
    explanations: [
      { kind: "standard", text: { en: "Carriers have one changed copy and one working copy of a gene. The working copy is enough, so carriers are usually healthy.", ar: "لدى الحاملين نسخة متغيرة ونسخة عاملة من الجين. النسخة العاملة تكفي، لذا يكون الحاملون أصحاء عادةً." } },
      { kind: "analogy", text: { en: "Think of a house with two lights in a room. If one bulb is broken, the other still lights the room. A carrier has one broken bulb and one working bulb.", ar: "تخيّل غرفة فيها مصباحان. إذا تعطّل أحدهما، يبقى الآخر يضيء الغرفة. الحامل لديه مصباح معطّل ومصباح يعمل." } },
      { kind: "simpler", text: { en: "Carrier means: you are healthy, and you hold one changed gene that you could pass on.", ar: "حامل تعني: أنت بصحة جيدة، ولديك جين متغير واحد يمكن أن تنقله." } },
    ],
  },
  {
    ...meta("chance"),
    questionId: "chance",
    prompt: {
      en: "If both partners carry a change in the same gene, what is the chance for each pregnancy?",
      ar: "إذا حمل الزوجان تغيراً في الجين نفسه، فما الاحتمال في كل حمل؟",
    },
    options: [
      { id: "a", text: { en: "1 in 4 for every pregnancy, each time", ar: "1 من 4 في كل حمل، في كل مرة" } },
      { id: "b", text: { en: "If the first child is affected, the next three will not be", ar: "إذا أُصيب الطفل الأول، فلن يُصاب الثلاثة التالون" } },
      { id: "c", text: { en: "Every child will be affected", ar: "سيُصاب كل الأطفال" } },
    ],
    correct: "a",
    explanations: [
      { kind: "standard", text: { en: "Each pregnancy has a 1 in 4 chance of being affected. The chance starts fresh every time and does not depend on earlier children.", ar: "لكل حمل احتمال 1 من 4 أن يكون مصاباً. يبدأ الاحتمال من جديد في كل مرة ولا يعتمد على الأطفال السابقين." } },
      { kind: "analogy", text: { en: "It is like drawing one card from four, then putting it back before the next draw. Each draw has the same 1 in 4 chance.", ar: "الأمر مثل سحب ورقة من أربع أوراق ثم إعادتها قبل السحب التالي. كل سحب له الاحتمال نفسه، 1 من 4." } },
      { kind: "simpler", text: { en: "Every pregnancy: 1 chance in 4. Same each time.", ar: "كل حمل: احتمال واحد من أربعة. هو نفسه في كل مرة." } },
    ],
  },
  {
    ...meta("diagnosis"),
    questionId: "diagnosis",
    prompt: { en: "Does this result tell you whether a baby will have the condition?", ar: "هل تخبرك هذه النتيجة إن كان الطفل سيُصاب بالحالة؟" },
    options: [
      { id: "a", text: { en: "Yes, it is a diagnosis", ar: "نعم، إنها تشخيص" } },
      { id: "b", text: { en: "No, it shows a chance. Other tests can give more certainty", ar: "لا، إنها تُظهر احتمالاً. وهناك فحوص أخرى تعطي يقيناً أكبر" } },
    ],
    correct: "b",
    explanations: [
      { kind: "standard", text: { en: "This result shows a chance, not a diagnosis. Testing during or before pregnancy can give more certainty, and a counsellor can explain the options.", ar: "تُظهر هذه النتيجة احتمالاً وليس تشخيصاً. يمكن لفحوص أثناء الحمل أو قبله أن تعطي يقيناً أكبر، ويمكن للمستشار شرح الخيارات." } },
      { kind: "analogy", text: { en: "A weather forecast of rain is not the same as rain falling. It tells you the chance, so you can plan.", ar: "توقّع المطر في النشرة الجوية ليس هو هطول المطر. إنه يخبرك بالاحتمال لتخطط." } },
      { kind: "simpler", text: { en: "No. It is a chance, not an answer about a baby.", ar: "لا. إنه احتمال، وليس إجابة عن طفل بعينه." } },
    ],
  },
];
