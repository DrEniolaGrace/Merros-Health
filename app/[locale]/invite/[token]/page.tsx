import { getTranslations, setRequestLocale } from "next-intl/server";
import { Drop, LockKey, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/chrome/top-bar";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { PageHero } from "@/components/ui/page-hero";
import { SafetyPill } from "@/components/ui/pill";

/**
 * What a relative sees when they open a private invitation (SPEC 6.4). The page never says who
 * sent it, which relative they are, or which gene is involved. It only records that it was opened.
 */
export default async function InvitePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("invite");
  const tsn = await getTranslations("screening");
  const ts = await getTranslations("safety");
  const invite = /^[A-Za-z0-9_-]{20,40}$/.test(token) ? await prisma.relativeInvite.findUnique({ where: { token } }) : null;
  if (invite && !invite.openedAt) await prisma.relativeInvite.update({ where: { id: invite.id }, data: { openedAt: new Date() } });

  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pb-32 pt-8 sm:px-8">
        {!invite ? (
          <GlassCard>
            <EmptyState title={t("invalidTitle")} body={t("invalidBody")} action={<LinkButton href="/" variant="secondary">{t("home")}</LinkButton>} />
          </GlassCard>
        ) : (
          <>
            <PageHero eyebrow={t("eyebrow")} title={t("title")} accent={t("accent")} body={t("body")} label={{ kind: "education", text: ts("education") }} />
            <GlassCard className="flex items-start gap-3">
              <LockKey size={22} weight="light" className="mt-1 shrink-0 text-gold-ink" />
              <p className="measure text-ink">{t("private")}</p>
            </GlassCard>
            <GlassCard className="flex flex-col gap-3">
              <div className="flex items-center gap-3"><UsersThree size={24} weight="light" className="text-rose-ink" /><h2 className="text-xl font-medium">{t("whyTitle")}</h2></div>
              <p className="measure text-ink">{t("whyBody")}</p>
            </GlassCard>
            <GlassCard className="flex flex-col gap-3">
              <div className="flex items-center gap-3"><Drop size={24} weight="light" className="text-rose-ink" /><h2 className="text-xl font-medium">{tsn("whatTitle")}</h2></div>
              <p className="measure text-ink">{tsn("whatBody")}</p>
              <p className="measure text-ink">{t("where")}</p>
            </GlassCard>
            <GlassCard tone="gold"><p className="measure text-ink">{t("choice")}</p></GlassCard>
            <SafetyPill kind="education" label={ts("education")} className="self-start" />
          </>
        )}
      </main>
    </>
  );
}
