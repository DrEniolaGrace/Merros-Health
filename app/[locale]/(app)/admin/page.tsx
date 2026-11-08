import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page";
import { IntegrityCheck } from "../privacy/privacy-controls";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(["admin"]);
  const t = await getTranslations("admin");
  const tp = await getTranslations("privacy");
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} body={t("body")} />
      <GlassCard className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t("auditTitle")}</h2>
        <p className="measure text-sm text-muted">{tp("integrityBody")}</p>
        <IntegrityCheck />
      </GlassCard>
      <GlassCard tone="gold"><p className="measure text-ink">{t("statement")}</p></GlassCard>
    </div>
  );
}
