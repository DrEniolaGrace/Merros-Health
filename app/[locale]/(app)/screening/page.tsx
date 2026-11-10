import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Drop, MapPin, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { ActionDock, PageHeader } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";

/** Preconception Screening Finder (SPEC 4.2). */
export default async function ScreeningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(["patient"]);
  const t = await getTranslations("screening");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");

  return (
    <Rise className="flex flex-col gap-6">
      <RiseItem><PageHeader eyebrow={tp("eyebrowScreening")} title={t("title")} body={t("body")} label={{ kind: "education", text: ts("education") }} /></RiseItem>
      <RiseItem>
        <GlassCard className="flex flex-col gap-4">
          <div className="flex items-center gap-3"><UsersThree size={24} weight="light" className="text-rose-ink" /><h2 className="text-xl font-medium">{t("whoTitle")}</h2></div>
          <ul className="flex list-disc flex-col gap-2 ps-5 text-ink">
            <li>{t("who1")}</li>
            <li>{t("who2")}</li>
            <li>{t("who3")}</li>
          </ul>
        </GlassCard>
      </RiseItem>
      <RiseItem>
        <GlassCard className="flex flex-col gap-3">
          <div className="flex items-center gap-3"><Drop size={24} weight="light" className="text-rose-ink" /><h2 className="text-xl font-medium">{t("whatTitle")}</h2></div>
          <p className="measure text-ink">{t("whatBody")}</p>
        </GlassCard>
      </RiseItem>
      <RiseItem>
        <GlassCard className="flex flex-col gap-3">
          <div className="flex items-center gap-3"><MapPin size={24} weight="light" className="text-rose-ink" /><h2 className="text-xl font-medium">{t("whereTitle")}</h2></div>
          <p className="measure text-ink">{t("whereBody")}</p>
        </GlassCard>
      </RiseItem>
      <RiseItem className="text-sm text-muted">{tc("pendingReview")}</RiseItem>
      <RiseItem>
        <ActionDock><LinkButton href="/support" size="lg" iconEnd={<ArrowRight size={20} />}>{t("talk")}</LinkButton></ActionDock>
      </RiseItem>
    </Rise>
  );
}
