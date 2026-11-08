import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/chrome/top-bar";
import { JudgeTour } from "@/components/tour/judge-tour";
import { PURPOSES } from "@/lib/consent/purposes";
import { CONSENT_TEXT } from "@/content/consent";
import { pick } from "@/content/types";
import { Wizard } from "./wizard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("title") };
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const { step } = await searchParams;
  const hasPartner = (await prisma.coupleLink.count({ where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] } })) > 0;

  const purposes = PURPOSES.filter((p) => p.purpose !== "couple_comparison" || hasPartner).map((p) => ({
    purpose: p.purpose,
    title: pick(CONSENT_TEXT[p.purpose].title, locale),
    body: pick(CONSENT_TEXT[p.purpose].body, locale),
    gold: p.purpose === "couple_comparison" || p.purpose === "view_own_result",
  }));

  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto max-w-2xl px-4 pb-40 pt-8 sm:px-8">
        <Wizard
          initialStep={Math.min(Math.max(Number(step) || 1, 1), 5)}
          locale={locale as "ar" | "en"}
          purposes={purposes}
          defaults={{
            readingLevel: user.profile?.readingLevel ?? "standard",
            mediaPref: user.profile?.mediaPref ?? "text",
            pregnancyStatus: user.profile?.pregnancyStatus ?? "prefer_not_to_say",
          }}
        />
      </main>
      <JudgeTour />
    </>
  );
}
