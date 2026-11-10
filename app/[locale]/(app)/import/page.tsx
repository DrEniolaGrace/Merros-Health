import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hasActiveConsent } from "@/lib/consent/check";
import { hasResultWaiting } from "@/lib/services/results";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { LAB_NAME } from "@/content/personas";
import { ImportPanel } from "./import-panel";

export default async function ImportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("import");
  const consents = await prisma.consent.findMany({ where: { userId: user.id } });
  const hasResult = (await prisma.labResult.count({ where: { userId: user.id } })) > 0;

  if (!hasActiveConsent(consents, "view_own_result")) {
    return (
      <GlassCard>
        <EmptyState title={t("noConsentTitle")} body={t("noConsentBody")} action={<LinkButton href="/privacy" variant="secondary">{t("noConsentAction")}</LinkButton>} />
      </GlassCard>
    );
  }
  if (!(await hasResultWaiting(user))) {
    return (
      <GlassCard>
        <EmptyState
          title={hasResult ? t("verifiedTitle") : t("noneTitle")}
          body={hasResult ? t("verifiedBody") : t("noneBody")}
          action={<LinkButton href={hasResult ? "/result" : "/home"}>{hasResult ? t("open") : t("noneTitle")}</LinkButton>}
        />
      </GlassCard>
    );
  }
  return <ImportPanel lab={LAB_NAME} />;
}
