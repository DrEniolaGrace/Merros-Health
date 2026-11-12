import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { LiveBadge } from "@/components/ui/accents";
import { CITIES, SERVICES } from "@/content/directory";
import { FindCare, type CareProvider } from "./find-care";

const LANGS = ["ar", "en", "hi", "ur", "ml", "fr"];

export default async function FindCarePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("findCare");
  const tc = await getTranslations("common");
  const ar = locale === "ar";
  const rows = await prisma.clinician.findMany({ include: { clinic: true }, orderBy: { nameEn: "asc" } });
  const city = (c: string) => (CITIES[c as keyof typeof CITIES]?.name[ar ? "ar" : "en"] ?? c);

  const providers: CareProvider[] = rows
    .filter((r) => r.clinic)
    .map((r) => ({
      id: r.id,
      service: r.service,
      languages: r.languages,
      gender: r.gender,
      video: r.video,
      inPerson: r.inPerson,
      nextSlotDays: r.nextSlotDays,
      city: r.clinic!.city,
      lat: r.clinic!.lat,
      lng: r.clinic!.lng,
      name: ar ? r.nameAr : r.nameEn,
      credentials: ar ? r.credentialsAr : r.credentialsEn,
      clinicKey: r.clinic!.id,
      clinicName: ar ? r.clinic!.nameAr : r.clinic!.nameEn,
      cityName: city(r.clinic!.city),
      insurance: r.clinic!.insurance,
      experienceYears: r.experienceYears,
    }));

  return (
    <div className="flex flex-col gap-8">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} accent={t("accent")} body={t("body")} badges={<LiveBadge tone="gold">{t("badge")}</LiveBadge>} />
      <FindCare
        providers={providers}
        familyDoctorId={user.familyDoctorId}
        cities={Object.fromEntries(Object.entries(CITIES).map(([k, v]) => [k, { lat: v.lat, lng: v.lng }]))}
        labels={{
          service: t("service"),
          language: t("language"),
          gender: t("gender"),
          near: t("near"),
          distance: t("distance"),
          sort: t("sort"),
          any: t("any"),
          anyDistance: t("anyDistance"),
          videoOnly: t("videoOnly"),
          services: Object.fromEntries(SERVICES.map((s) => [s, t(`services.${s}`)])),
          languages: Object.fromEntries(LANGS.map((l) => [l, t(`languages.${l}`)])),
          genders: { female: t("female"), male: t("male") },
          cities: Object.fromEntries(Object.keys(CITIES).map((c) => [c, city(c)])),
          sortDistance: t("sortDistance"),
          sortSoonest: t("sortSoonest"),
          km: t.raw("km"),
          within: t.raw("within"),
          results: t.raw("results"),
          years: t.raw("years"),
          nextSlot: t.raw("nextSlot"),
          today: t("today"),
          video: t("video"),
          inPerson: t("inPerson"),
          insurance: t("insurance"),
          book: t("book"),
          setDoctor: t("setDoctor"),
          myDoctor: t("myDoctor"),
          removeDoctor: t("removeDoctor"),
          doctorSheetTitle: t("doctorSheetTitle"),
          doctorSheetBody: t.raw("doctorSheetBody"),
          doctorShare: t("doctorShare"),
          doctorShareDesc: t("doctorShareDesc"),
          doctorConfirm: t("doctorConfirm"),
          mapLabel: t("mapLabel"),
          emptyTitle: t("emptyTitle"),
          emptyBody: t("emptyBody"),
          clear: t("clear"),
          close: tc("close"),
          synthetic: t("synthetic"),
        }}
      />
    </div>
  );
}
