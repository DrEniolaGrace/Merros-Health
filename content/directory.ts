/**
 * Find Care directory (SPEC 4.10). EVERY clinic and clinician here is fictional, with synthetic
 * coordinates near Abu Dhabi, Al Ain and Al Dhafra. No real provider is represented.
 */
import type { Bi } from "./types";

export const SERVICES = ["genetic_counselling", "family_medicine", "ivf_pgtm", "maternal_fetal", "haematology", "psychology"] as const;
export type Service = (typeof SERVICES)[number];

export const CITIES = {
  abu_dhabi: { lat: 24.4539, lng: 54.3773, name: { en: "Abu Dhabi", ar: "أبوظبي" } },
  al_ain: { lat: 24.2075, lng: 55.7447, name: { en: "Al Ain", ar: "العين" } },
  al_dhafra: { lat: 23.6524, lng: 53.7028, name: { en: "Al Dhafra", ar: "الظفرة" } },
} as const;
export type City = keyof typeof CITIES;

export interface SeedClinic {
  key: string;
  name: Bi;
  city: City;
  lat: number;
  lng: number;
  insurance: string[];
}

/**
 * Every clinic and clinician here is fictional. The kinds of service and where they sit follow the
 * real Abu Dhabi picture described in Appendix 13 of the DoH Premarital Screening Standard
 * (clinical genetics in large hospitals in Abu Dhabi and Al Ain; genetic counselling clinics in
 * maternity, fertility and ambulatory services; haemoglobinopathy services; trained family
 * physicians), without copying any real institution's name.
 */
export const CLINICS: SeedClinic[] = [
  { key: "c1", name: { en: "Al Marjan Hospital, Clinical Genetics (fictional)", ar: "مستشفى المرجان، قسم الوراثة السريرية (افتراضي)" }, city: "abu_dhabi", lat: 24.4712, lng: 54.3411, insurance: ["Thiqa", "Daman"] },
  { key: "c2", name: { en: "Al Reem Ambulatory Health Centre (fictional)", ar: "مركز الريم للرعاية الصحية الخارجية (افتراضي)" }, city: "abu_dhabi", lat: 24.4991, lng: 54.4043, insurance: ["Thiqa", "Daman", "ADNIC"] },
  { key: "c3", name: { en: "Khalifa City Fertility Centre (fictional)", ar: "مركز مدينة خليفة للخصوبة (افتراضي)" }, city: "abu_dhabi", lat: 24.4201, lng: 54.5774, insurance: ["Daman"] },
  { key: "c4", name: { en: "Mushrif Maternity Hospital (fictional)", ar: "مستشفى المشرف للولادة (افتراضي)" }, city: "abu_dhabi", lat: 24.4407, lng: 54.3895, insurance: ["Thiqa", "Daman", "ADNIC"] },
  { key: "c5", name: { en: "Al Jimi Hospital, Clinical Genetics (fictional)", ar: "مستشفى الجيمي، قسم الوراثة السريرية (افتراضي)" }, city: "al_ain", lat: 24.2331, lng: 55.7302, insurance: ["Thiqa", "Daman"] },
  { key: "c6", name: { en: "Al Ain Oasis Family Practice (fictional)", ar: "عيادة واحة العين للعائلة (افتراضية)" }, city: "al_ain", lat: 24.2183, lng: 55.7658, insurance: ["Thiqa"] },
  { key: "c7", name: { en: "Madinat Zayed Community Hospital (fictional)", ar: "مستشفى مدينة زايد المجتمعي (افتراضي)" }, city: "al_dhafra", lat: 23.6841, lng: 53.7059, insurance: ["Thiqa", "Daman"] },
  { key: "c8", name: { en: "Ruwais Family Health Centre (fictional)", ar: "مركز الرويس لصحة العائلة (افتراضي)" }, city: "al_dhafra", lat: 24.1103, lng: 52.7306, insurance: ["Thiqa", "ADNIC"] },
];

export interface SeedClinician {
  key: string;
  name: Bi;
  credentials: Bi;
  service: Service;
  clinic: string;
  languages: string[];
  gender: "female" | "male";
  experienceYears: number;
  video: boolean;
  inPerson: boolean;
  nextSlotDays: number;
  /** The demo counsellor account is linked to this entry. */
  isLayla?: boolean;
}

const cred = (en: string, ar: string): Bi => ({ en: `${en} (fictional)`, ar: `${ar} (افتراضي)` });

export const CLINICIANS: SeedClinician[] = [
  { key: "layla", isLayla: true, name: { en: "Dr. Layla Haddad", ar: "د. ليلى حداد" }, credentials: cred("MSc Genetic Counselling, certified genetic counsellor", "ماجستير الإرشاد الوراثي، مستشارة وراثية معتمدة"), service: "genetic_counselling", clinic: "c1", languages: ["ar", "en"], gender: "female", experienceYears: 11, video: true, inPerson: true, nextSlotDays: 1 },
  { key: "yousef", name: { en: "Dr. Yousef Al Mansoori", ar: "د. يوسف المنصوري" }, credentials: cred("Clinical geneticist, genetic counselling", "استشاري وراثة سريرية وإرشاد وراثي"), service: "genetic_counselling", clinic: "c5", languages: ["ar", "en"], gender: "male", experienceYears: 15, video: true, inPerson: true, nextSlotDays: 3 },
  { key: "priya", name: { en: "Ms. Priya Nair", ar: "أ. بريا ناير" }, credentials: cred("MSc Genetic Counselling", "ماجستير الإرشاد الوراثي"), service: "genetic_counselling", clinic: "c4", languages: ["en", "hi", "ml"], gender: "female", experienceYears: 6, video: true, inPerson: false, nextSlotDays: 2 },
  { key: "fatima", name: { en: "Dr. Fatima Al Zaabi", ar: "د. فاطمة الزعابي" }, credentials: cred("Family medicine consultant", "استشارية طب الأسرة"), service: "family_medicine", clinic: "c2", languages: ["ar", "en"], gender: "female", experienceYears: 14, video: true, inPerson: true, nextSlotDays: 1 },
  { key: "omar_k", name: { en: "Dr. Omar Khoury", ar: "د. عمر خوري" }, credentials: cred("Family physician", "طبيب أسرة"), service: "family_medicine", clinic: "c6", languages: ["ar", "en", "fr"], gender: "male", experienceYears: 9, video: false, inPerson: true, nextSlotDays: 2 },
  { key: "sana", name: { en: "Dr. Sana Rahman", ar: "د. سناء رحمن" }, credentials: cred("Family physician", "طبيبة أسرة"), service: "family_medicine", clinic: "c8", languages: ["en", "ur", "ar"], gender: "female", experienceYears: 7, video: true, inPerson: true, nextSlotDays: 4 },
  { key: "hessa", name: { en: "Dr. Hessa Al Suwaidi", ar: "د. حصة السويدي" }, credentials: cred("Reproductive medicine consultant, IVF and PGT-M", "استشارية طب الإنجاب، أطفال الأنابيب وفحص الأجنة"), service: "ivf_pgtm", clinic: "c3", languages: ["ar", "en"], gender: "female", experienceYears: 17, video: true, inPerson: true, nextSlotDays: 6 },
  { key: "daniel", name: { en: "Dr. Daniel Farah", ar: "د. دانيال فرح" }, credentials: cred("Fertility specialist, IVF and PGT-M", "اختصاصي خصوبة، أطفال الأنابيب وفحص الأجنة"), service: "ivf_pgtm", clinic: "c3", languages: ["en", "ar"], gender: "male", experienceYears: 12, video: false, inPerson: true, nextSlotDays: 9 },
  { key: "mona", name: { en: "Dr. Mona El Sayed", ar: "د. منى السيد" }, credentials: cred("Maternal fetal medicine consultant", "استشارية طب الأم والجنين"), service: "maternal_fetal", clinic: "c4", languages: ["ar", "en"], gender: "female", experienceYears: 16, video: false, inPerson: true, nextSlotDays: 5 },
  { key: "ahmed", name: { en: "Dr. Ahmed Al Nuaimi", ar: "د. أحمد النعيمي" }, credentials: cred("Maternal fetal medicine specialist", "اختصاصي طب الأم والجنين"), service: "maternal_fetal", clinic: "c5", languages: ["ar", "en"], gender: "male", experienceYears: 10, video: true, inPerson: true, nextSlotDays: 7 },
  { key: "reem", name: { en: "Dr. Reem Al Hashmi", ar: "د. ريم الهاشمي" }, credentials: cred("Paediatric haematologist, thalassaemia and sickle cell", "استشارية أمراض دم الأطفال، الثلاسيميا والخلايا المنجلية"), service: "haematology", clinic: "c4", languages: ["ar", "en"], gender: "female", experienceYears: 13, video: true, inPerson: true, nextSlotDays: 4 },
  { key: "tariq", name: { en: "Dr. Tariq Aziz", ar: "د. طارق عزيز" }, credentials: cred("Haematologist", "استشاري أمراض الدم"), service: "haematology", clinic: "c7", languages: ["ar", "en", "ur"], gender: "male", experienceYears: 19, video: false, inPerson: true, nextSlotDays: 8 },
  { key: "noor", name: { en: "Ms. Noor Al Ali", ar: "أ. نور العلي" }, credentials: cred("Clinical psychologist", "أخصائية نفسية إكلينيكية"), service: "psychology", clinic: "c2", languages: ["ar", "en"], gender: "female", experienceYears: 8, video: true, inPerson: true, nextSlotDays: 1 },
  { key: "sami", name: { en: "Mr. Sami Darwish", ar: "أ. سامي درويش" }, credentials: cred("Counselling psychologist", "أخصائي نفسي إرشادي"), service: "psychology", clinic: "c6", languages: ["ar", "en"], gender: "male", experienceYears: 5, video: true, inPerson: false, nextSlotDays: 3 },
];
