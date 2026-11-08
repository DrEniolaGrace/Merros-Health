import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page";
import { Rise, RiseItem } from "@/components/ui/rise";
import { Link } from "@/i18n/navigation";
import { CONDITIONS } from "@/content/conditions";
import { pick } from "@/content/types";

export default async function LearnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("learn");
  const ts = await getTranslations("safety");
  const level = user.profile?.readingLevel ?? "standard";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} body={t("body")} label={{ kind: "education", text: ts("education") }} />
      <Rise as="ul" className="grid gap-4 md:grid-cols-2">
        {CONDITIONS.map((c) => (
          <RiseItem as="li" key={c.conditionId}>
            <Link href={`/learn/${c.conditionId}`} className="group block h-full rounded-card">
              <GlassCard tilt className="flex h-full flex-col gap-3 transition-colors duration-500 group-hover:bg-glass-strong">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-medium">{pick(c.name, locale)}</h2>
                  <span className="text-xs text-muted tabular" dir="ltr">{c.gene}</span>
                </div>
                <p className="line-clamp-3 text-sm text-muted">{pick(c.summary[level], locale)}</p>
                <ArrowRight size={18} className="mt-auto text-rose-ink transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
              </GlassCard>
            </Link>
          </RiseItem>
        ))}
      </Rise>
    </div>
  );
}
