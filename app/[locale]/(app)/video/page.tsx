import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { getOwnResult } from "@/lib/services/results";
import { summarisePerson } from "@/lib/risk/engine";
import { buildScript } from "@/lib/video/script";
import { features } from "@/lib/features";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { Disclosure } from "@/components/ui/disclosure";
import { ResultVideoPlayer } from "@/components/video/result-video-player";
import { OPTIONS, seededShuffle } from "@/content/options";
import { pick } from "@/content/types";

export default async function VideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("video");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");
  const own = await getOwnResult(user, { log: false });

  if (own.status !== "ok") {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader eyebrow={tp("eyebrowVideo")} title={t("title")} body={t("body")} />
        <GlassCard><EmptyState title={t("needResultTitle")} body={t("needResultBody")} action={<LinkButton href="/result" variant="secondary">{t("needResultAction")}</LinkButton>} /></GlassCard>
      </div>
    );
  }

  const lang = locale === "ar" ? "ar" : "en";
  // Same per person order as the Options Explorer, so the video implies no ranking either.
  const options = seededShuffle(OPTIONS, user.profile?.presentationSeed ?? 1).map((o) => pick(o.title, locale));
  const script = buildScript(summarisePerson(own.result.variants), options.length);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={tp("eyebrowVideo")} title={t("title")} body={t("body")} label={{ kind: "education", text: ts("education") }} />
      <ResultVideoPlayer
        script={script}
        locale={lang}
        labels={{ working: t("working"), changed: t("changed"), affected: t("affected"), carrier: t("carrier"), neither: t("neither"), brand: t("brand"), options }}
        ui={{ narrate: t("narrate"), narrateDesc: t("narrateDesc"), playerLabel: t("playerLabel") }}
      />
      <GlassCard className="p-0">
        <Disclosure title={t("transcript")}>
          <ol className="flex list-decimal flex-col gap-3 ps-5 text-sm text-ink" data-video-transcript>
            {script.scenes.map((s, i) => <li key={i}>{pick(s.caption, locale)}</li>)}
          </ol>
        </Disclosure>
      </GlassCard>
      <ul className="flex flex-col gap-2 text-sm text-muted">
        {(["private", "noNames", "show"] as const).map((k) => <li key={k} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t(k)}</li>)}
      </ul>
      <p className="measure text-xs text-muted">{features().resultVideo === "player" ? t("modePlayer") : t("modeRender")} · {tc("pendingReview")}</p>
    </div>
  );
}
