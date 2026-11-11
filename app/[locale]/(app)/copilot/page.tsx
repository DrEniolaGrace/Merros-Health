import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { MAX_QUESTION_CHARS } from "@/lib/ai/copilot";
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
          </>
        }
        aside={<CopilotOrb size={120} />}
      />
      <Chat
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
        }}
      />
      <p className="text-xs text-muted">{t("disclaimer")}</p>
    </div>
  );
}
