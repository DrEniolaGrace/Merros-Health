import { getTranslations, setRequestLocale } from "next-intl/server";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isConsentActive } from "@/lib/consent/check";
import { PURPOSES } from "@/lib/consent/purposes";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader, SectionTitle } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";
import { EmptyState } from "@/components/ui/states";
import { CONSENT_TEXT } from "@/content/consent";
import { pick } from "@/content/types";
import { ConsentToggles, DeleteData, IntegrityCheck } from "./privacy-controls";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("privacy");
  const tp = await getTranslations("page");
  const tc = await getTranslations("common");
  const now = new Date();
  const [consents, logs, hasPartner] = await Promise.all([
    prisma.consent.findMany({ where: { userId: user.id } }),
    prisma.accessLog.findMany({ where: { subjectId: user.id }, orderBy: { seq: "desc" }, take: 30 }),
    prisma.coupleLink.count({ where: { OR: [{ partnerAId: user.id }, { partnerBId: user.id }] } }),
  ]);
  const actorIds = [...new Set(logs.map((l) => l.actorId).filter((a) => a !== user.id && a !== "system"))];
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, displayNameEn: true, displayNameAr: true, role: true } });
  const ar = locale === "ar";
  const fmtDate = (d: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);
  const fmtTime = (d: Date) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(d);
  const actorName = (id: string) => {
    if (id === user.id) return t("you");
    if (id === "system") return t("system");
    const a = actors.find((x) => x.id === id);
    return a ? (ar ? a.displayNameAr : a.displayNameEn) : id.slice(0, 8);
  };

  const toggles = PURPOSES.filter((p) => p.purpose !== "couple_comparison" || hasPartner > 0).map((p) => {
    const active = consents.filter((c) => c.purpose === p.purpose && isConsentActive(c, now)).sort((a, b) => +b.grantedAt - +a.grantedAt)[0];
    return {
      purpose: p.purpose,
      title: pick(CONSENT_TEXT[p.purpose].title, locale),
      body: pick(CONSENT_TEXT[p.purpose].body, locale),
      on: !!active,
      until: active ? (active.expiresAt ? tc("until", { date: fmtDate(active.expiresAt) }) : tc("noExpiry")) : null,
    };
  });

  return (
    <Rise className="flex flex-col gap-10">
      <RiseItem><PageHeader eyebrow={tp("eyebrowPrivacy")} title={t("title")} body={t("body")} /></RiseItem>

      <RiseItem className="flex flex-col gap-4">
        <SectionTitle>{t("choices")}</SectionTitle>
        <GlassCard><ConsentToggles items={toggles} /></GlassCard>
        <p className="text-sm text-muted">{t("relatives")}</p>
      </RiseItem>

      <RiseItem className="flex flex-col gap-4">
        <SectionTitle>{t("history")}</SectionTitle>
        <GlassCard className="p-0">
          {logs.length === 0 ? (
            <EmptyState title={t("historyEmpty")} body={t("integrityBody")} />
          ) : (
            <ul className="divide-y divide-glass-border">
              {logs.map((l) => (
                <li key={l.seq} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-ink">{t(`actions.${l.action}` as "actions.login")}</span>
                  <span className="text-sm text-muted">
                    {actorName(l.actorId)} · <span className="tabular">{fmtTime(l.at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </RiseItem>

      <RiseItem>
        <GlassCard className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">{t("integrity")}</h2>
          <p className="measure text-sm text-muted">{t("integrityBody")}</p>
          <IntegrityCheck />
        </GlassCard>
      </RiseItem>

      <RiseItem className="grid gap-4 md:grid-cols-2">
        <GlassCard className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t("export")}</h2>
          <p className="text-sm text-muted">{t("exportBody")}</p>
          <a
            href="/api/export"
            download
            className="glass mt-auto inline-flex h-12 items-center justify-center gap-2 self-start rounded-control px-6 text-sm font-medium text-ink transition-[background,transform] duration-500 hover:-translate-y-px hover:bg-glass-strong"
          >
            <DownloadSimple size={18} weight="light" />
            {t("export")}
          </a>
        </GlassCard>
        <GlassCard className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t("delete")}</h2>
          <p className="text-sm text-muted">{t("deleteBody")}</p>
          <DeleteData />
        </GlassCard>
      </RiseItem>
    </Rise>
  );
}
