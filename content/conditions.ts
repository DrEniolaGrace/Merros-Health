/**
 * Condition cards (SPEC 4.3). Original plain language summaries written for Meros, citing
 * MedlinePlus Genetics and GeneReviews. Balanced: what it is, treatments, quality of life.
 * All pending accredited clinical review.
 */
import type { Bi, ByLevel, ContentMeta } from "./types";

export interface Condition extends ContentMeta {
  conditionId: string;
  gene: string;
  name: Bi;
  summary: ByLevel;
  carriers: Bi;
  treatment: Bi;
  life: Bi;
}

const mp = (slug: string) => ({ title: "MedlinePlus Genetics", url: `https://medlineplus.gov/genetics/condition/${slug}/` });
const gr = (nbk: string, title: string) => ({ title: `GeneReviews: ${title}`, url: `https://www.ncbi.nlm.nih.gov/books/${nbk}/` });
const meta = (id: string, sources: ContentMeta["sources"]): ContentMeta => ({
  id: `condition.${id}`, version: 1, label: "education", source: "curated", reviewStatus: "pending_accredited_review", sources,
});

export const CONDITIONS: Condition[] = [
  {
    ...meta("beta-thalassaemia", [mp("beta-thalassemia"), gr("NBK1426", "Beta-Thalassemia")]),
    conditionId: "beta-thalassaemia",
    gene: "HBB",
    name: { en: "Beta thalassaemia", ar: "الثلاسيميا بيتا" },
    summary: {
      simple: {
        en: "Beta thalassaemia affects how the body makes haemoglobin, the part of blood that carries oxygen. A child can have it only if they get a changed gene from both parents.",
        ar: "تؤثر الثلاسيميا بيتا على طريقة صنع الجسم للهيموغلوبين، وهو جزء الدم الذي يحمل الأكسجين. لا يُصاب الطفل إلا إذا ورث جيناً متغيراً من كلا الوالدين.",
      },
      standard: {
        en: "Beta thalassaemia is an inherited blood condition in which the body makes less beta globin, part of haemoglobin. When a child inherits two changed HBB genes, they can develop anaemia that ranges from mild to severe. It is common in the Gulf region.",
        ar: "الثلاسيميا بيتا حالة دم وراثية يُنتج فيها الجسم كمية أقل من بروتين بيتا غلوبين، وهو جزء من الهيموغلوبين. عندما يرث الطفل نسختين متغيرتين من جين HBB، قد يصاب بفقر دم يتراوح بين الخفيف والشديد. وهي شائعة في منطقة الخليج.",
      },
      detailed: {
        en: "Beta thalassaemia results from variants in HBB that reduce (β+) or abolish (β0) beta globin production, leading to ineffective red cell production. Inheriting two variants causes thalassaemia major or intermedia depending on the variants; the clinical picture is shaped by the specific combination, other modifier genes, and co inherited alpha thalassaemia.",
        ar: "تنتج الثلاسيميا بيتا عن متغيرات في جين HBB تُقلّل إنتاج بيتا غلوبين (β+) أو توقفه (β0)، مما يؤدي إلى خلل في إنتاج خلايا الدم الحمراء. وراثة متغيرين تسبب الثلاسيميا الكبرى أو المتوسطة بحسب المتغيرات؛ وتتأثر الصورة السريرية بالتركيبة المحددة والجينات المعدِّلة الأخرى ووجود ثلاسيميا ألفا مصاحبة.",
      },
    },
    carriers: {
      en: "Carriers (thalassaemia trait) are usually healthy. Some have slightly small red blood cells or mild anaemia, which can be mistaken for iron deficiency.",
      ar: "حاملو المرض (سمة الثلاسيميا) يتمتعون عادةً بصحة جيدة. بعضهم لديه كريات دم حمراء أصغر قليلاً أو فقر دم خفيف قد يُخلط بينه وبين نقص الحديد.",
    },
    treatment: {
      en: "Care can include regular blood transfusions with medicines that remove extra iron. A stem cell (bone marrow) transplant can cure it for some children, and gene therapies are emerging.",
      ar: "قد تشمل الرعاية نقل دم منتظماً مع أدوية تزيل الحديد الزائد. ويمكن لزراعة الخلايا الجذعية (نخاع العظم) أن تشفي بعض الأطفال، كما تظهر علاجات جينية جديدة.",
    },
    life: {
      en: "With regular specialist care, many people with beta thalassaemia study, work and have families. Care is lifelong and needs planning.",
      ar: "مع الرعاية المتخصصة المنتظمة، يدرس كثير من المصابين بالثلاسيميا بيتا ويعملون ويكوّنون أسراً. الرعاية مستمرة مدى الحياة وتحتاج إلى تخطيط.",
    },
  },
  {
    ...meta("sickle-cell", [mp("sickle-cell-disease"), gr("NBK1377", "Sickle Cell Disease")]),
    conditionId: "sickle-cell",
    gene: "HBB",
    name: { en: "Sickle cell disease", ar: "مرض الخلايا المنجلية" },
    summary: {
      simple: {
        en: "Sickle cell disease changes the shape of red blood cells so they can block small blood vessels. A child can have it only if they get a changed gene from both parents.",
        ar: "يغيّر مرض الخلايا المنجلية شكل كريات الدم الحمراء فتسد الأوعية الدموية الصغيرة. لا يُصاب الطفل إلا إذا ورث جيناً متغيراً من كلا الوالدين.",
      },
      standard: {
        en: "Sickle cell disease is an inherited blood condition caused by a change in the HBB gene called haemoglobin S. Red blood cells can become stiff and curved, which can cause pain episodes, anaemia and a higher risk of infections.",
        ar: "مرض الخلايا المنجلية حالة دم وراثية سببها تغيّر في جين HBB يُسمى الهيموغلوبين S. قد تصبح كريات الدم الحمراء صلبة ومقوّسة، مما قد يسبب نوبات ألم وفقر دم وزيادة خطر العدوى.",
      },
      detailed: {
        en: "Sickle cell disease includes HbSS and compound genotypes such as HbS/β thalassaemia. Polymerisation of deoxygenated HbS causes vaso occlusion and haemolysis. Severity varies widely and is influenced by foetal haemoglobin levels; some Gulf populations carry haplotypes associated with milder disease.",
        ar: "يشمل مرض الخلايا المنجلية النمط HbSS والأنماط المركبة مثل HbS مع الثلاسيميا بيتا. تبلمر الهيموغلوبين S غير المؤكسج يسبب انسداداً وعائياً وتكسّراً في الدم. تتفاوت الشدة كثيراً وتتأثر بمستوى الهيموغلوبين الجنيني؛ وتحمل بعض المجتمعات الخليجية أنماطاً جينية مرتبطة بمرض أخف.",
      },
    },
    carriers: {
      en: "People with sickle cell trait are usually healthy. In rare extreme conditions, such as severe dehydration or very high altitude, they may need extra care.",
      ar: "حاملو سمة الخلايا المنجلية يتمتعون عادةً بصحة جيدة. في ظروف نادرة وقاسية، مثل الجفاف الشديد أو الارتفاعات العالية جداً، قد يحتاجون إلى عناية إضافية.",
    },
    treatment: {
      en: "Treatments include medicines such as hydroxyurea, pain management, vaccines and antibiotics to prevent infection, transfusions, and for some, stem cell transplant or gene therapy.",
      ar: "تشمل العلاجات أدوية مثل الهيدروكسي يوريا، وإدارة الألم، واللقاحات والمضادات الحيوية للوقاية من العدوى، ونقل الدم، ولدى بعض المرضى زراعة الخلايا الجذعية أو العلاج الجيني.",
    },
    life: {
      en: "Experiences differ a lot between people. Early diagnosis and good care help many people live full lives.",
      ar: "تختلف التجارب كثيراً من شخص لآخر. يساعد التشخيص المبكر والرعاية الجيدة كثيرين على عيش حياة كاملة.",
    },
  },
  {
    ...meta("sma", [mp("spinal-muscular-atrophy"), gr("NBK1352", "Spinal Muscular Atrophy")]),
    conditionId: "sma",
    gene: "SMN1",
    name: { en: "Spinal muscular atrophy (SMA)", ar: "ضمور العضلات الشوكي" },
    summary: {
      simple: {
        en: "SMA affects the nerves that control muscles, so muscles become weak. A child can have it only if they get a changed gene from both parents.",
        ar: "يؤثر ضمور العضلات الشوكي على الأعصاب التي تتحكم في العضلات، فتضعف العضلات. لا يُصاب الطفل إلا إذا ورث جيناً متغيراً من كلا الوالدين.",
      },
      standard: {
        en: "SMA is an inherited condition that affects motor nerve cells in the spinal cord, causing muscle weakness. Most often it happens when both copies of the SMN1 gene are missing. Severity ranges from very serious in infancy to milder forms in adulthood.",
        ar: "ضمور العضلات الشوكي حالة وراثية تؤثر على الخلايا العصبية الحركية في الحبل الشوكي فتسبب ضعف العضلات. يحدث غالباً عند غياب نسختي جين SMN1 كلتيهما. تتراوح الشدة بين حالات خطيرة جداً في الرضاعة وأشكال أخف في البلوغ.",
      },
      detailed: {
        en: "SMA is most commonly caused by homozygous deletion of SMN1 exon 7. Clinical type (0 to 4) correlates with the number of SMN2 copies. Carrier testing measures SMN1 copy number; a result of two copies lowers but does not remove carrier chance, because some people carry two SMN1 copies on one chromosome (a 2+0 arrangement).",
        ar: "ينتج ضمور العضلات الشوكي غالباً عن حذف متماثل للإكسون 7 في جين SMN1. ويرتبط النوع السريري (من 0 إلى 4) بعدد نسخ جين SMN2. يقيس فحص الحاملين عدد نسخ SMN1؛ ونتيجة النسختين تقلل احتمال الحمل لكنها لا تلغيه، لأن بعض الأشخاص يحملون نسختين على كروموسوم واحد (ترتيب 2+0).",
      },
    },
    carriers: {
      en: "Carriers have one working SMN1 copy and are healthy.",
      ar: "لدى حاملي المرض نسخة واحدة عاملة من جين SMN1، وهم أصحاء.",
    },
    treatment: {
      en: "Several treatments now exist, including medicines that boost the SMN protein and a one time gene therapy. They work best when started early, which is why newborn screening matters.",
      ar: "توجد الآن عدة علاجات، منها أدوية تزيد بروتين SMN وعلاج جيني يُعطى مرة واحدة. وتكون أكثر فاعلية عند البدء بها مبكراً، ولهذا يهم فحص حديثي الولادة.",
    },
    life: {
      en: "Outlook has changed a great deal in recent years. Many children treated early reach movement milestones that were not possible before.",
      ar: "تغيّرت التوقعات كثيراً في السنوات الأخيرة. كثير من الأطفال الذين عولجوا مبكراً يحققون مراحل حركية لم تكن ممكنة سابقاً.",
    },
  },
  {
    ...meta("gjb2-hearing-loss", [mp("nonsyndromic-hearing-loss"), gr("NBK1272", "Nonsyndromic Hearing Loss and Deafness, DFNB1")]),
    conditionId: "gjb2-hearing-loss",
    gene: "GJB2",
    name: { en: "GJB2 related hearing loss", ar: "فقدان السمع المرتبط بجين GJB2" },
    summary: {
      simple: {
        en: "Changes in the GJB2 gene are a common cause of hearing loss present from birth. A child can have it only if they get a changed gene from both parents.",
        ar: "التغيرات في جين GJB2 سبب شائع لفقدان السمع منذ الولادة. لا يتأثر الطفل إلا إذا ورث جيناً متغيراً من كلا الوالدين.",
      },
      standard: {
        en: "GJB2 related hearing loss affects the inner ear. Children who inherit two changed GJB2 genes usually have hearing loss from birth, from mild to profound. It does not affect other parts of the body.",
        ar: "يؤثر فقدان السمع المرتبط بجين GJB2 على الأذن الداخلية. الأطفال الذين يرثون نسختين متغيرتين من الجين يكون لديهم عادةً فقدان سمع منذ الولادة، يتراوح بين الخفيف والعميق. ولا يؤثر على أجزاء أخرى من الجسم.",
      },
      detailed: {
        en: "Biallelic GJB2 variants (DFNB1) are a leading cause of congenital non syndromic sensorineural hearing loss. c.35delG is frequent in many populations. Severity varies by genotype; truncating variants on both alleles are usually associated with severe to profound loss.",
        ar: "المتغيرات في نسختي جين GJB2 (DFNB1) من أبرز أسباب فقدان السمع الحسي العصبي الخلقي غير المتلازمي. المتغير c.35delG شائع في كثير من المجتمعات. تختلف الشدة بحسب النمط الجيني؛ وغالباً ما ترتبط المتغيرات المبتورة في النسختين بفقدان شديد إلى عميق.",
      },
    },
    carriers: {
      en: "Carriers have normal hearing.",
      ar: "حاملو المتغير سمعهم طبيعي.",
    },
    treatment: {
      en: "Newborn hearing screening finds it early. Support includes hearing aids, cochlear implants, and sign language, chosen with the family.",
      ar: "يكشفه فحص السمع لحديثي الولادة مبكراً. ويشمل الدعم المعينات السمعية وزراعة القوقعة ولغة الإشارة، وتُختار مع الأسرة.",
    },
    life: {
      en: "Many deaf and hard of hearing people live full lives, and some see deafness as part of their identity and culture rather than an illness.",
      ar: "يعيش كثير من الصم وضعاف السمع حياة كاملة، ويرى بعضهم الصمم جزءاً من هويتهم وثقافتهم وليس مرضاً.",
    },
  },
  {
    ...meta("cystic-fibrosis", [mp("cystic-fibrosis"), gr("NBK1250", "CFTR-Related Disorders")]),
    conditionId: "cystic-fibrosis",
    gene: "CFTR",
    name: { en: "Cystic fibrosis", ar: "التليّف الكيسي" },
    summary: {
      simple: {
        en: "Cystic fibrosis makes mucus in the body thick and sticky, which affects the lungs and digestion. A child can have it only if they get a changed gene from both parents.",
        ar: "يجعل التليّف الكيسي المخاط في الجسم سميكاً ولزجاً، مما يؤثر على الرئتين والهضم. لا يُصاب الطفل إلا إذا ورث جيناً متغيراً من كلا الوالدين.",
      },
      standard: {
        en: "Cystic fibrosis is an inherited condition caused by changes in the CFTR gene. Thick mucus builds up in the lungs and digestive system, leading to chest infections and difficulty absorbing food.",
        ar: "التليّف الكيسي حالة وراثية سببها تغيرات في جين CFTR. يتراكم المخاط السميك في الرئتين والجهاز الهضمي، مما يؤدي إلى التهابات صدرية وصعوبة في امتصاص الغذاء.",
      },
      detailed: {
        en: "CFTR encodes a chloride channel; biallelic pathogenic variants impair epithelial ion transport. Phenotype depends on variant class. CFTR modulator therapies target specific variant classes, so genotype matters for treatment eligibility.",
        ar: "يرمّز جين CFTR قناة للكلوريد؛ وتُضعف المتغيرات الممرِضة في النسختين نقل الأيونات في الأنسجة الظهارية. يعتمد النمط الظاهري على فئة المتغير. وتستهدف علاجات معدِّلات CFTR فئات محددة من المتغيرات، لذا يؤثر النمط الجيني على أهلية العلاج.",
      },
    },
    carriers: { en: "Carriers are healthy.", ar: "حاملو المرض أصحاء." },
    treatment: {
      en: "Care includes airway clearance, enzymes to help digestion, and for many people, newer medicines called CFTR modulators that treat the underlying cause.",
      ar: "تشمل الرعاية تنظيف المجاري الهوائية، وإنزيمات تساعد الهضم، ولدى كثيرين أدوية حديثة تُسمى معدِّلات CFTR تعالج السبب الأساسي.",
    },
    life: {
      en: "Life expectancy and quality of life have improved greatly with modern treatment.",
      ar: "تحسّن متوسط العمر وجودة الحياة كثيراً مع العلاجات الحديثة.",
    },
  },
  {
    ...meta("alpha-thalassaemia", [mp("alpha-thalassemia"), gr("NBK1435", "Alpha-Thalassemia")]),
    conditionId: "alpha-thalassaemia",
    gene: "HBA1/HBA2",
    name: { en: "Alpha thalassaemia", ar: "الثلاسيميا ألفا" },
    summary: {
      simple: {
        en: "Alpha thalassaemia affects haemoglobin. People have four alpha globin genes, and the effect depends on how many are changed.",
        ar: "تؤثر الثلاسيميا ألفا على الهيموغلوبين. لدى الإنسان أربعة جينات ألفا غلوبين، ويعتمد التأثير على عدد الجينات المتغيرة.",
      },
      standard: {
        en: "Alpha thalassaemia is very common in the Gulf. With one or two changed alpha genes, people are usually healthy. With three, a condition called HbH disease can cause anaemia. With all four changed, a pregnancy is severely affected.",
        ar: "الثلاسيميا ألفا شائعة جداً في الخليج. مع تغيّر جين أو جينين من جينات ألفا، يكون الشخص سليماً عادةً. ومع ثلاثة جينات قد يسبب داء الهيموغلوبين H فقر دم. ومع تغيّر الجينات الأربعة يتأثر الحمل تأثراً شديداً.",
      },
      detailed: {
        en: "Inheritance of alpha thalassaemia depends on whether deletions are in cis (--/αα) or trans (-α/-α). Couple risk for HbH disease or Hb Bart's hydrops fetalis requires knowing each partner's arrangement, so results are always interpreted with a counsellor.",
        ar: "تعتمد وراثة الثلاسيميا ألفا على ما إذا كانت الحذوفات على الكروموسوم نفسه (--/αα) أو على كروموسومين مختلفين (-α/-α). ويتطلب تقدير احتمال داء الهيموغلوبين H أو استسقاء الجنين بهيموغلوبين بارت معرفة ترتيب كل شريك، لذا تُفسَّر النتائج دائماً مع مستشار.",
      },
    },
    carriers: {
      en: "Silent carriers and people with alpha thalassaemia trait are usually healthy.",
      ar: "الحاملون الصامتون والأشخاص ذوو سمة الثلاسيميا ألفا أصحاء عادةً.",
    },
    treatment: {
      en: "HbH disease is often managed with monitoring, folic acid and occasional transfusions. Severe forms in pregnancy need specialist care.",
      ar: "غالباً ما يُدار داء الهيموغلوبين H بالمتابعة وحمض الفوليك ونقل الدم أحياناً. وتحتاج الأشكال الشديدة أثناء الحمل إلى رعاية متخصصة.",
    },
    life: {
      en: "Most people with alpha thalassaemia trait never notice it. People with HbH disease usually live full lives with regular follow up.",
      ar: "معظم ذوي سمة الثلاسيميا ألفا لا يلاحظونها أبداً. ويعيش المصابون بداء الهيموغلوبين H عادةً حياة كاملة مع متابعة منتظمة.",
    },
  },
];

export function conditionById(id: string): Condition | undefined {
  return CONDITIONS.find((c) => c.conditionId === id);
}
