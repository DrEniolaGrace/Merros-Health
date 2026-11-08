import { getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/chrome/top-bar";
import { DsInteractive } from "./ds-interactive";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ds" });
  return { title: t("title") };
}

const TOKENS = [
  ["--bg-deep", "bg-deep"],
  ["--bg-raised", "bg-raised"],
  ["--glass", "glass"],
  ["--text-primary", "ink"],
  ["--text-secondary", "muted"],
  ["--burgundy", "burgundy"],
  ["--burgundy-glow", "burgundy-glow"],
  ["--rose-light", "rose"],
  ["--pearl-gold", "gold"],
  ["--data-cyan", "cyan"],
  ["--gold-ink", "gold-ink"],
  ["--cyan-ink", "cyan-ink"],
] as const;

const TYPE_SCALE = [
  ["text-5xl", "4"],
  ["text-4xl", "3"],
  ["text-3xl", "2.25"],
  ["text-2xl", "1.75"],
  ["text-xl", "1.375"],
  ["text-lg", "1.125"],
  ["text-base", "1"],
  ["text-sm", "0.875"],
  ["text-xs", "0.75"],
] as const;

const SPACES = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

export default async function DesignSystemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ds");

  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-32 pt-8 sm:px-8">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.2em] text-gold-ink">{t("feeling")}</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
          <p className="measure text-lg text-muted">{t("intro")}</p>
        </header>

        <Section title={t("colours")} note={t("coloursNote")}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {TOKENS.map(([cssVar, name]) => (
              <li key={cssVar} className="glass flex items-center gap-3 rounded-card p-3">
                <span className="h-12 w-12 shrink-0 rounded-control border border-glass-border" style={{ background: `var(${cssVar})` }} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink" dir="ltr">{name}</span>
                  <span className="block truncate text-xs text-muted" dir="ltr">{cssVar}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("type")} note={t("typeNote")}>
          <div className="glass flex flex-col gap-4 rounded-card p-6">
            <p className="font-display text-2xl font-semibold tracking-tight sm:text-4xl" dir="ltr" lang="en">Sora — Understanding, privately.</p>
            <p className="text-xl sm:text-2xl" dir="rtl" lang="ar">Readex Pro — فهمٌ هادئ وخاص لنتيجتك</p>
            <p className="text-lg" dir="ltr" lang="en">Readex Pro — Body and interface text in both scripts.</p>
            <p className="tabular text-2xl text-cyan-ink" dir="ltr">25% · 43.75% · 1 in 4 · 0123456789</p>
            <ul className="mt-4 flex flex-col gap-2 border-t border-glass-border pt-4">
              {TYPE_SCALE.map(([cls, rem]) => (
                <li key={cls} className="flex items-baseline gap-4">
                  <span className="w-24 shrink-0 text-xs text-muted tabular" dir="ltr">{rem}rem</span>
                  <span className={`${cls} truncate`}>{t("feeling")}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title={t("spacing")} note={t("spacingNote")}>
          <div className="glass flex flex-col gap-6 rounded-card p-6">
            <ul className="flex flex-col gap-2">
              {SPACES.map((s) => (
                <li key={s} className="flex items-center gap-4">
                  <span className="w-12 shrink-0 text-xs text-muted tabular" dir="ltr">{s}</span>
                  <span className="h-3 rounded-full bg-[linear-gradient(90deg,var(--burgundy-glow),var(--rose-light))]" style={{ width: s }} />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-end gap-4">
              {[
                ["rounded-control", "12"],
                ["rounded-card", "20"],
                ["rounded-hero", "28"],
                ["rounded-full", "full"],
              ].map(([cls, label]) => (
                <div key={cls} className="flex flex-col items-center gap-2">
                  <span className={`h-16 w-24 border border-glass-border bg-glass-strong ${cls}`} />
                  <span className="text-xs text-muted tabular" dir="ltr">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <DsInteractive locale={locale} />
      </main>
    </>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium">{title}</h2>
        {note && <p className="measure text-sm text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}
