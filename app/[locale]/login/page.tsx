import { getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/chrome/top-bar";
import { PageHeader, SectionTitle } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/motion";
import { JudgeTour } from "@/components/tour/judge-tour";
import { PERSONAS } from "@/content/personas";
import { PersonaCard } from "./persona-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: t("title") };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("login");
  const ar = locale === "ar";
  const visible = PERSONAS.filter((p) => p.showInPicker);
  const groups = [
    { title: t("patients"), items: visible.filter((p) => p.role === "patient") },
    { title: t("staff"), items: visible.filter((p) => p.role !== "patient") },
  ];

  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-32 pt-8 sm:px-8">
        <PageHeader title={t("title")} body={t("body")} />
        {groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-4">
            <SectionTitle>{g.title}</SectionTitle>
            <Rise className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((p) => (
                <RiseItem key={p.key}>
                  <PersonaCard
                    personaKey={p.key}
                    name={ar ? p.nameAr : p.nameEn}
                    story={ar ? p.storyAr : p.storyEn}
                    tag={p.role === "patient" ? (p.onboarded ? t("onboarded") : p.variants ? t("fresh") : undefined) : undefined}
                    cta={t("enter", { name: ar ? p.nameAr : p.nameEn })}
                  />
                </RiseItem>
              ))}
            </Rise>
          </section>
        ))}
      </main>
      <JudgeTour />
    </>
  );
}
