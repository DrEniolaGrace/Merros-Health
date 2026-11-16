import { getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/chrome/top-bar";
import { PageHeader, SectionTitle } from "@/components/ui/page";
import { GlassCard } from "@/components/ui/glass-card";
import { BackLink } from "@/components/ui/back-link";
import { PANEL_SOURCE } from "@/lib/risk/panel";
import panel from "@/data/reference/doh-pms-panel.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sources" });
  return { title: t("title") };
}

const SOURCES = [
  "doh",
  "hgnc",
  "clinvar",
  "medlineplus",
  "acmg",
  "bennett",
  "sure",
  "nccn",
  "osm",
] as const;

/** About Merros and the sources it uses. Public: no sign in needed. */
export default async function SourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sources");
  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto flex max-w-3xl flex-col gap-10 px-4 pb-24 pt-8 sm:px-8">
        <BackLink href="/" label={t("back")} />
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
        <GlassCard tone="gold" className="flex flex-col gap-2" data-not-affiliated>
          <p className="text-lg font-medium text-ink">{t("independentTitle")}</p>
          <p className="measure text-ink">{t("independent")}</p>
        </GlassCard>
        <section className="flex flex-col gap-4">
          <SectionTitle>{t("listTitle")}</SectionTitle>
          <ul className="flex flex-col gap-3">
            {SOURCES.map((k) => (
              <li key={k}>
                <GlassCard className="flex flex-col gap-1" data-source={k}>
                  <p className="text-base font-medium text-ink">{t(`items.${k}.title`)}</p>
                  <p className="text-sm text-muted">{t(`items.${k}.use`)}</p>
                  {k === "doh" && (
                    <p className="text-sm text-ink" dir="ltr">
                      {PANEL_SOURCE.publisher}. {PANEL_SOURCE.title}. {PANEL_SOURCE.reference}, version {PANEL_SOURCE.version}, {PANEL_SOURCE.published}.{" "}
                      <a href={PANEL_SOURCE.url} className="break-all text-cyan-ink underline-offset-4 hover:underline" rel="noreferrer" target="_blank">{PANEL_SOURCE.url}</a>
                    </p>
                  )}
                  {k === "doh" && <p className="text-xs text-muted">{t("panelCounts", { unique: panel.counts.unique, printed: panel.counts.printedEntries, renamed: panel.counts.renamedSincePublication })}</p>}
                </GlassCard>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-xs text-muted">{t("synthetic")}</p>
      </main>
    </>
  );
}
