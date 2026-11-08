import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader, SectionTitle } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/motion";
import { conditionById } from "@/content/conditions";
import { pick, type ReadingLevel } from "@/content/types";
import { LevelSwitch } from "./level-switch";

export default async function ConditionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const c = conditionById(id);
  if (!c) notFound();
  const t = await getTranslations("learn");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");
  const tds = await getTranslations("ds");
  const q = (await searchParams).level;
  const level: ReadingLevel = q === "simple" || q === "standard" || q === "detailed" ? q : (user.profile?.readingLevel ?? "standard");

  return (
    <Rise className="flex flex-col gap-8">
      <RiseItem>
        <PageHeader eyebrow={c.gene} title={pick(c.name, locale)} label={{ kind: "education", text: ts("education") }} />
      </RiseItem>
      <RiseItem>
        <LevelSwitch
          current={level}
          label={t("level")}
          options={[
            { value: "simple", label: tds("simple") },
            { value: "standard", label: tds("standard") },
            { value: "detailed", label: tds("detailed") },
          ]}
        />
      </RiseItem>
      <RiseItem>
        <GlassCard hero>
          <p className="measure text-lg text-ink">{pick(c.summary[level], locale)}</p>
        </GlassCard>
      </RiseItem>
      {(
        [
          [t("carriers"), c.carriers],
          [t("treatment"), c.treatment],
          [t("life"), c.life],
        ] as const
      ).map(([title, body]) => (
        <RiseItem key={title} className="flex flex-col gap-3">
          <SectionTitle>{title}</SectionTitle>
          <p className="measure text-muted">{pick(body, locale)}</p>
        </RiseItem>
      ))}
      <RiseItem className="flex flex-col gap-2 border-t border-glass-border pt-6 text-sm text-muted">
        <p>{tc("sources")}</p>
        <ul className="flex flex-col gap-1">
          {c.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer noopener" className="text-rose-ink underline-offset-4 hover:underline" dir="ltr">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
        <p>{tc("pendingReview")}</p>
      </RiseItem>
    </Rise>
  );
}
