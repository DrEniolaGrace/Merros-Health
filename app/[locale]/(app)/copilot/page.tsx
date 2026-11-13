import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { MAX_QUESTION_CHARS } from "@/lib/ai/copilot";
import { features } from "@/lib/features";
import { PageHero } from "@/components/ui/page-hero";
import { LiveBadge } from "@/components/ui/accents";
import { Chat, CopilotOrb } from "./chat";

export default async function CopilotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(["patient"]);
  const t = await getTranslations("copilot");
  const ts = await getTranslations("safety");
  const offline = (process.env.AI_PROVIDER ?? "mock").toLowerCase() === "mock";
  const azureVoice = features().voice === "azure";

  return (
    <div className="flex flex-col gap-8">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        accent={t("accent")}
        body={t("body")}
        badges={
          <>
            <LiveBadge tone="cyan">{t("badgeSafe")}</LiveBadge>
            {offline && <LiveBadge tone="gold">{t("badgeOffline")}</LiveBadge>}
            <LiveBadge tone={azureVoice ? "cyan" : "rose"}>{azureVoice ? t("badgeVoiceAzure") : t("badgeVoiceBrowser")}</LiveBadge>
          </>
        }
        aside={<CopilotOrb size={120} />}
      />
      <Chat
        voice={{ azure: azureVoice, locale: locale === "ar" ? "ar" : "en" }}
        labels={{
          placeholder: t("placeholder"),
          send: t("send"),
          thinking: t("thinking"),
          suggestionsTitle: t("suggestionsTitle"),
          suggestions: [t("q1"), t("q2"), t("q3"), t("q4")],
          education: ts("education"),
          decision_support: ts("decision_support"),
          sources: t("sources"),
          how: t("how"),
          blocked: t("blocked"),
          counsellor: t("counsellor"),
          counsellorCta: t("counsellorCta"),
          offline: t("offlineNote"),
          you: t("you"),
          copilot: t("eyebrow"),
          agents: {
            orchestrator: t("agentOrchestrator"),
            interpreter: t("agentInterpreter"),
            explainer: t("agentExplainer"),
            dialect: t("agentDialect"),
            verifier: t("agentVerifier"),
            escalation: t("agentEscalation"),
          },
          maxLength: MAX_QUESTION_CHARS,
          mic: t("mic"),
          micStop: t("micStop"),
          listening: t("listening"),
          transcribing: t("transcribing"),
          listen: t("listen"),
          listenStop: t("listenStop"),
          voiceErrors: { mic_denied: t("errMic"), not_understood: t("errNotUnderstood"), too_long: t("errTooLong"), failed: t("errFailed") },
        }}
      />
      <p className="text-xs text-muted">{t("disclaimer")}{azureVoice ? "" : ` ${t("voiceBrowserNote")}`}</p>
    </div>
  );
}
