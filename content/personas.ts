/**
 * Synthetic demo personas (SPEC 5). Every person here is fictional.
 * Variants are real, well known ClinVar records (IDs verified via NCBI E-utilities on 2026-11-08,
 * see data/reference/SOURCES.md); assigning them to these fictional people is synthetic.
 */
import type { Variant } from "@/lib/risk/types";

export const PANEL_GENES = ["HBB", "HBA1", "HBA2", "SMN1", "GJB2", "CFTR", "G6PD"];
export const LAB_NAME = "Synthetic Abu Dhabi Screening Lab (demo)";

const HBB_IVS1_5: Variant = { gene: "HBB", hgvs: "NM_000518.5(HBB):c.92+5G>C", zygosity: "heterozygous", acmg: "pathogenic", clinvarId: "15447", conditionId: "beta-thalassaemia" };
const HBB_CD39: Variant = { gene: "HBB", hgvs: "NM_000518.5(HBB):c.118C>T (p.Gln40Ter)", zygosity: "heterozygous", acmg: "pathogenic", clinvarId: "15402", conditionId: "beta-thalassaemia" };
const HBB_HBS: Variant = { gene: "HBB", hgvs: "NM_000518.5(HBB):c.20A>T (p.Glu7Val)", zygosity: "heterozygous", acmg: "pathogenic", clinvarId: "15333", conditionId: "sickle-cell" };
const HBB_VUS: Variant = { gene: "HBB", hgvs: "NM_000518.4(HBB):c.371C>A (p.Thr124Asn)", zygosity: "heterozygous", acmg: "vus", clinvarId: "15584", conditionId: "beta-thalassaemia" };
const GJB2_35DEL: Variant = { gene: "GJB2", hgvs: "NM_004004.6(GJB2):c.35del (p.Gly12fs)", zygosity: "heterozygous", acmg: "pathogenic", clinvarId: "17004", conditionId: "gjb2-hearing-loss" };
// SMA carrier status is a copy number result (one SMN1 copy), not a single ClinVar variant.
const SMN1_ONE_COPY: Variant = { gene: "SMN1", hgvs: "SMN1 exon 7 copy number = 1 (deletion of one copy)", zygosity: "heterozygous", acmg: "pathogenic", clinvarId: null, conditionId: "sma" };

export type PersonaRole = "patient" | "counsellor" | "admin";

export interface Persona {
  key: string;
  role: PersonaRole;
  nameEn: string;
  nameAr: string;
  storyEn: string;
  storyAr: string;
  /** null = no lab result (outside the premarital programme). */
  variants: Variant[] | null;
  partnerKey?: string;
  coupleStatus?: "engaged" | "married";
  /** Seed state: already onboarded with these consents, or fresh (judge walks through onboarding). */
  onboarded: boolean;
  locale: "ar" | "en";
  readingLevel: "simple" | "standard" | "detailed";
  mediaPref: "text" | "audio" | "both";
  pregnancyStatus: "none" | "trying" | "pregnant" | "prefer_not_to_say";
  showInPicker: boolean;
}

export const PERSONAS: Persona[] = [
  {
    key: "mariam", role: "patient", nameEn: "Mariam", nameAr: "مريم",
    storyEn: "Engaged to her first cousin Khalid. Her premarital screening result has just arrived.",
    storyAr: "مخطوبة لابن عمها خالد. وصلت للتو نتيجة فحص ما قبل الزواج.",
    variants: [HBB_IVS1_5, GJB2_35DEL], partnerKey: "khalid", coupleStatus: "engaged",
    onboarded: false, locale: "en", readingLevel: "standard", mediaPref: "text", pregnancyStatus: "none", showInPicker: true,
  },
  {
    key: "khalid", role: "patient", nameEn: "Khalid", nameAr: "خالد",
    storyEn: "Mariam's fiancé and first cousin. Has already seen his own result and agreed to compare.",
    storyAr: "خطيب مريم وابن عمها. اطّلع على نتيجته ووافق على المقارنة.",
    variants: [HBB_CD39, GJB2_35DEL], partnerKey: "mariam", coupleStatus: "engaged",
    onboarded: true, locale: "ar", readingLevel: "standard", mediaPref: "text", pregnancyStatus: "none", showInPicker: true,
  },
  {
    key: "noura", role: "patient", nameEn: "Noura", nameAr: "نورة",
    storyEn: "Carries SMA (SMN1). Her fiancé Faisal is not a carrier on the panel.",
    storyAr: "حاملة لضمور العضلات الشوكي. خطيبها فيصل ليس حاملاً حسب الفحص.",
    variants: [SMN1_ONE_COPY], partnerKey: "faisal", coupleStatus: "engaged",
    onboarded: true, locale: "en", readingLevel: "standard", mediaPref: "text", pregnancyStatus: "none", showInPicker: true,
  },
  {
    key: "faisal", role: "patient", nameEn: "Faisal", nameAr: "فيصل",
    storyEn: "Noura's fiancé. No reportable variants on the tested panel.",
    storyAr: "خطيب نورة. لا توجد متغيرات تستدعي الإبلاغ في الفحص.",
    variants: [], partnerKey: "noura", coupleStatus: "engaged",
    onboarded: true, locale: "ar", readingLevel: "standard", mediaPref: "text", pregnancyStatus: "none", showInPicker: false,
  },
  {
    key: "hamad", role: "patient", nameEn: "Hamad", nameAr: "حمد",
    storyEn: "Has a variant of uncertain significance (VUS) in HBB that may be reclassified later.",
    storyAr: "لديه متغير غير مؤكد الأهمية في جين HBB قد يُعاد تصنيفه لاحقاً.",
    variants: [HBB_VUS],
    onboarded: true, locale: "en", readingLevel: "detailed", mediaPref: "text", pregnancyStatus: "none", showInPicker: true,
  },
  {
    key: "aisha", role: "patient", nameEn: "Aisha", nameAr: "عائشة",
    storyEn: "Prefers Arabic, simple language and listening rather than reading. Carries sickle cell trait.",
    storyAr: "تفضّل العربية واللغة البسيطة والاستماع بدل القراءة. حاملة لسمة الخلايا المنجلية.",
    variants: [HBB_HBS],
    onboarded: false, locale: "ar", readingLevel: "simple", mediaPref: "audio", pregnancyStatus: "prefer_not_to_say", showInPicker: true,
  },
  {
    key: "sara", role: "patient", nameEn: "Sara", nameAr: "سارة",
    storyEn: "Married to Omar, planning a pregnancy, never had carrier screening.",
    storyAr: "متزوجة من عمر، تخطط للحمل، ولم تُجرِ فحص الحاملين من قبل.",
    variants: null, partnerKey: "omar", coupleStatus: "married",
    onboarded: true, locale: "en", readingLevel: "standard", mediaPref: "text", pregnancyStatus: "trying", showInPicker: true,
  },
  {
    key: "omar", role: "patient", nameEn: "Omar", nameAr: "عمر",
    storyEn: "Sara's husband. Not screened yet.",
    storyAr: "زوج سارة. لم يُجرِ الفحص بعد.",
    variants: null, partnerKey: "sara", coupleStatus: "married",
    onboarded: true, locale: "ar", readingLevel: "standard", mediaPref: "text", pregnancyStatus: "trying", showInPicker: false,
  },
  {
    key: "layla", role: "counsellor", nameEn: "Dr. Layla Haddad", nameAr: "د. ليلى حداد",
    storyEn: "Fictional genetic counsellor. Sees escalated cases and booked sessions.",
    storyAr: "مستشارة وراثية افتراضية. ترى الحالات المحالة والجلسات المحجوزة.",
    variants: null,
    onboarded: true, locale: "en", readingLevel: "detailed", mediaPref: "text", pregnancyStatus: "prefer_not_to_say", showInPicker: true,
  },
  {
    key: "admin", role: "admin", nameEn: "Programme Admin", nameAr: "مسؤول البرنامج",
    storyEn: "Department of Health programme view. Verifies audit integrity; dashboard arrives in Phase 4.",
    storyAr: "واجهة دائرة الصحة. تتحقق من سلامة سجل التدقيق؛ لوحة المؤشرات في المرحلة الرابعة.",
    variants: null,
    onboarded: true, locale: "en", readingLevel: "standard", mediaPref: "text", pregnancyStatus: "prefer_not_to_say", showInPicker: true,
  },
];

export function persona(key: string): Persona {
  const p = PERSONAS.find((x) => x.key === key);
  if (!p) throw new Error(`Unknown persona ${key}`);
  return p;
}

export const COUNSELLOR = {
  nameEn: "Dr. Layla Haddad",
  nameAr: "د. ليلى حداد",
  credentialsEn: "MSc Genetic Counselling, certified genetic counsellor (fictional)",
  credentialsAr: "ماجستير الإرشاد الوراثي، مستشارة وراثية معتمدة (افتراضية)",
  licenceNo: "DEMO-GC-0001",
  languages: ["ar", "en"],
  gender: "female",
};
