/** Core explanations shown on the Risk Explainer (SPEC 4.3). All pending accredited review. */
import type { Bi, ByLevel, ContentMeta } from "./types";

const m = (id: string, label: ContentMeta["label"] = "education"): ContentMeta => ({
  id: `explainer.${id}`, version: 1, label, source: "curated", reviewStatus: "pending_accredited_review",
  sources: [{ title: "MedlinePlus Genetics: What does it mean to have a genetic predisposition / inheritance patterns", url: "https://medlineplus.gov/genetics/understanding/inheritance/inheritancepatterns/" }],
});

export const CARRIER_MEANING: ContentMeta & { body: ByLevel } = {
  ...m("carrier"),
  body: {
    simple: {
      en: "We all have two copies of most genes, one from each parent. You have one changed copy and one working copy. The working copy does the job, so you stay healthy. This is called being a carrier.",
      ar: "لدينا جميعاً نسختان من معظم الجينات، واحدة من كل والد. لديك نسخة متغيرة ونسخة عاملة. النسخة العاملة تؤدي المهمة، لذا تبقى بصحة جيدة. وهذا ما يُسمى بأن تكون حاملاً.",
    },
    standard: {
      en: "Being a carrier means you have one changed copy of a gene and one working copy. Carriers are usually healthy. It matters mainly for future children: if both parents carry a change in the same gene, a pregnancy can inherit both changed copies.",
      ar: "أن تكون حاملاً يعني أن لديك نسخة متغيرة من الجين ونسخة عاملة. الحاملون أصحاء عادةً. ويهم ذلك أساساً للأطفال في المستقبل: إذا حمل الوالدان تغيراً في الجين نفسه، فقد يرث الحمل النسختين المتغيرتين.",
    },
    detailed: {
      en: "You are heterozygous for a pathogenic or likely pathogenic variant in a gene with autosomal recessive inheritance. One functional allele is sufficient, so carriers are typically unaffected. Reproductive relevance arises when a partner is heterozygous for a pathogenic variant in the same gene.",
      ar: "لديك متغير ممرِض أو محتمل الإمراض في نسخة واحدة (متخالف الزيجوت) في جين يورَّث بنمط جسمي متنحٍّ. تكفي نسخة واحدة عاملة، لذا لا يتأثر الحاملون عادةً. وتظهر الأهمية الإنجابية عندما يحمل الشريك متغيراً ممرِضاً في الجين نفسه.",
    },
  },
};

export const NOT_A_DIAGNOSIS: ContentMeta & { title: Bi; body: Bi } = {
  ...m("not-a-diagnosis"),
  title: { en: "Risk is not a diagnosis", ar: "الاحتمال ليس تشخيصاً" },
  body: {
    en: "These numbers describe chance, not what will happen. Each pregnancy is independent. A genetic counsellor can explain what this means for you and what tests can give more certainty.",
    ar: "تصف هذه الأرقام احتمالاً، وليس ما سيحدث بالضرورة. كل حمل مستقل عن غيره. يمكن للمستشار الوراثي أن يشرح ما يعنيه ذلك لك والفحوص التي تعطي يقيناً أكبر.",
  },
};

export const LIMITS: ContentMeta & { items: { title: Bi; body: Bi }[] } = {
  ...m("limits"),
  items: [
    {
      title: { en: "What this test does not cover", ar: "ما لا يغطيه هذا الفحص" },
      body: {
        en: "The screening panel looks at a set list of genes. It cannot find changes in genes that were not tested, and some changes in tested genes can be missed.",
        ar: "يفحص هذا الاختبار قائمة محددة من الجينات. لا يمكنه كشف تغيرات في جينات لم تُفحص، وقد لا تُكتشف بعض التغيرات في الجينات المفحوصة.",
      },
    },
    {
      title: { en: "Residual risk", ar: "الاحتمال المتبقي" },
      body: {
        en: "A result with no changes lowers the chance of being a carrier but does not make it zero. Every couple, related or not, has a small background chance of a child with a health condition.",
        ar: "النتيجة الخالية من التغيرات تقلل احتمال أن تكون حاملاً لكنها لا تجعله صفراً. ولكل زوجين، أقارب أو غير أقارب، احتمال صغير أساسي لإنجاب طفل بحالة صحية.",
      },
    },
    {
      title: { en: "What a VUS means", ar: "ماذا يعني المتغير غير مؤكد الأهمية" },
      body: {
        en: "A variant of uncertain significance (VUS) is a change that science cannot yet classify. It is not counted in any risk number here. Most VUS are later found to be harmless, and a counsellor will tell you if it is reclassified.",
        ar: "المتغير غير مؤكد الأهمية هو تغيّر لا يستطيع العلم تصنيفه بعد. لا يُحتسب في أي رقم احتمالي هنا. وغالبية هذه المتغيرات يتبيّن لاحقاً أنها غير ضارة، وسيخبرك المستشار إذا أُعيد تصنيفه.",
      },
    },
    {
      title: { en: "Related couples", ar: "الأزواج الأقارب" },
      body: {
        en: "Couples who are related can share more of their DNA, which can add a small extra chance that a panel cannot see. A counsellor can talk this through with you without judgement.",
        ar: "قد يتشارك الأزواج الأقارب جزءاً أكبر من الحمض النووي، مما قد يضيف احتمالاً إضافياً صغيراً لا يكشفه الفحص. يمكن للمستشار مناقشة ذلك معك دون أي حكم.",
      },
    },
  ],
};

export const NO_VARIANTS: ContentMeta & { body: ByLevel } = {
  ...m("no-variants"),
  body: {
    simple: {
      en: "No changes were found in the genes that were tested. This lowers the chance you are a carrier, but no test can find everything.",
      ar: "لم يُعثر على تغيرات في الجينات التي فُحصت. هذا يقلل احتمال أن تكون حاملاً، لكن لا يوجد فحص يكشف كل شيء.",
    },
    standard: {
      en: "No reportable variants were found on the tested panel. Your chance of being a carrier for these conditions is lower than before testing, but not zero.",
      ar: "لم يُعثر على متغيرات تستدعي الإبلاغ في الجينات المفحوصة. احتمال أن تكون حاملاً لهذه الحالات أقل مما كان قبل الفحص، لكنه ليس صفراً.",
    },
    detailed: {
      en: "No pathogenic, likely pathogenic or uncertain variants were reported on the panel. Residual carrier risk depends on the test's detection rate and population carrier frequency for each gene.",
      ar: "لم يُبلَّغ عن متغيرات ممرِضة أو محتملة الإمراض أو غير مؤكدة في الجينات المفحوصة. ويعتمد الاحتمال المتبقي على معدل الكشف في الفحص وعلى تكرار الحاملين في المجتمع لكل جين.",
    },
  },
};
