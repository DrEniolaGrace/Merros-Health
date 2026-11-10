import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page";
import { PathwayTimeline } from "@/components/pathway/timeline";

export default async function PathwayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("pathway");
  const tp = await getTranslations("page");
  const events = await prisma.pathwayEvent.findMany({ where: { userId: user.id } });
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={tp("eyebrowJourney")} title={t("title")} body={t("body")} />
      <PathwayTimeline locale={locale} events={events.map((e) => ({ step: e.step, at: e.at.toISOString() }))} />
    </div>
  );
}
