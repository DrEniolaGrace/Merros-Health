import { getTranslations } from "next-intl/server";
import type { PlanContext, PlanLabels, PlanNext } from "@/components/plan/your-plan";

/** Builds the "Your plan" texts for one context on the server (also passed down to client screens). */
export async function planLabels(context: PlanContext, next: PlanNext): Promise<PlanLabels> {
  const t = await getTranslations("plan");
  return {
    eyebrow: t("eyebrow"),
    title: t("title"),
    intro: t(`intro.${context}`),
    counsellingTitle: t("counsellingTitle"),
    counsellingBody: t(`counsellingBody.${context}`),
    counsellingCta: t("counsellingCta"),
    optionsTitle: t("optionsTitle"),
    optionsBody: t("optionsBody"),
    optionsCta: t("optionsCta"),
    valuesCta: t("valuesCta"),
    nextTitle: t("nextTitle"),
    nextBody: t(`next.${next}.body`),
    nextCta: t(`next.${next}.cta`),
    note: t("note"),
  };
}
