import { getTranslations } from "next-intl/server";
import { TopBar } from "@/components/chrome/top-bar";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto max-w-xl px-4 py-16">
        <GlassCard>
          <EmptyState title={t("notFoundTitle")} body={t("notFoundBody")} action={<LinkButton href="/" variant="secondary">{t("home")}</LinkButton>} />
        </GlassCard>
      </main>
    </>
  );
}
