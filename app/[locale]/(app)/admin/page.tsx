import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader, SectionTitle } from "@/components/ui/page";
import { StatRow } from "@/components/ui/accents";
import { IntegrityCheck } from "../privacy/privacy-controls";
import { SimulateUpdate } from "../counsellor/counsellor-actions";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(["admin"]);
  const t = await getTranslations("admin");
  const tp = await getTranslations("page");
  const tpr = await getTranslations("privacy");
  const tc = await getTranslations("counsellor");
  const [events, relatives, invites, opened] = await Promise.all([
    prisma.reclassificationEvent.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.pedigreeNode.count(),
    prisma.relativeInvite.count(),
    prisma.relativeInvite.count({ where: { openedAt: { not: null } } }),
  ]);
  const cls = (c: string) => tc(`class.${c}` as "class.vus");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={tp("eyebrowProgramme")} title={t("title")} body={t("body")} />

      <section className="flex flex-col gap-4">
        <SectionTitle>{t("livingTitle")}</SectionTitle>
        {events.length === 0 ? (
          <GlassCard className="flex flex-col gap-4">
            <p className="text-sm text-muted">{t("livingEmpty")}</p>
            {env().DEMO_MODE === "true" && <SimulateUpdate label={tc("simulate")} done={tc.raw("simulateDone")} />}
          </GlassCard>
        ) : (
          events.map((e) => (
            <GlassCard key={e.id} className="flex flex-wrap items-center justify-between gap-4" data-reclass-event>
              <p className="text-ink">
                <span dir="ltr" className="tabular">{e.gene} · VCV{e.clinvarId.padStart(9, "0")}</span>
                <br />
                <span className="text-sm text-muted">{cls(e.oldClass)}</span> <ArrowRight size={14} className="inline rtl:-scale-x-100" /> <span className="text-sm text-gold-ink">{cls(e.newClass)}</span>
              </p>
              <p className="font-display text-xl text-cyan-ink tabular">{t("affected", { count: e.affected })}</p>
            </GlassCard>
          ))
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>{t("familyTitle")}</SectionTitle>
        <StatRow
          items={[
            { value: String(relatives), label: t("statRelatives") },
            { value: String(invites), label: t("statInvites") },
            { value: String(opened), label: t("statOpened") },
          ]}
        />
        <p className="text-xs text-muted">{t("countsNote")}</p>
      </section>

      <GlassCard className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t("auditTitle")}</h2>
        <p className="measure text-sm text-muted">{tpr("integrityBody")}</p>
        <IntegrityCheck />
      </GlassCard>
      <GlassCard tone="gold"><p className="measure text-ink">{t("statement")}</p></GlassCard>
    </div>
  );
}
