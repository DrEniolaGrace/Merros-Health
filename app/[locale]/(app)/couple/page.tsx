import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { getCoupleStatus } from "@/lib/services/results";
import { GENES } from "@/lib/risk/genes";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { conditionById } from "@/content/conditions";
import { LIMITS, NOT_A_DIAGNOSIS } from "@/content/explainer";
import { pick } from "@/content/types";
import { BlindMatch } from "./blind-match";

export default async function CouplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("couple");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tds = await getTranslations("ds");
  const tc = await getTranslations("common");
  const te = await getTranslations("errors");
  const couple = await getCoupleStatus(user);

  if (couple.status === "no_partner") {
    return <GlassCard><EmptyState title={t("noPartnerTitle")} body={t("noPartnerBody")} /></GlassCard>;
  }
  if (!couple.selfHasResult) {
    return (
      <GlassCard>
        <EmptyState title={t("needResultTitle")} body={t("needResultBody")} action={<LinkButton href="/result" variant="secondary">{t("needResultAction")}</LinkButton>} />
      </GlassCard>
    );
  }

  const ar = locale === "ar";
  const partnerName = ar ? couple.partner.displayNameAr : couple.partner.displayNameEn;
  const geneConditions = Object.fromEntries(
    Object.values(GENES).map((g) => [g.symbol, g.conditionIds.map((id) => conditionById(id)).filter(Boolean).map((c) => pick(c!.name, locale)).join(" / ") || g.symbol]),
  );

  return (
    <BlindMatch
      userId={user.id}
      linkId={couple.linkId}
      me={ar ? user.displayNameAr : user.displayNameEn}
      partnerName={partnerName}
      partnerPersona={env().DEMO_MODE === "true" ? couple.partner.personaKey : null}
      geneConditions={geneConditions}
      locale={locale}
      gridLabels={{
        title: tds("fourSquare"),
        parentA: tds("parentA"),
        parentB: tds("parentB"),
        nonCarrier: tds("nonCarrier"),
        carrier: tds("carrier"),
        affected: tds("affected"),
        summary: tds("fourSummary"),
      }}
      labels={{
        eyebrow: tp("eyebrowCouple"),
        education: ts("education"),
        sealedTitle: t("awaitingSelfTitle"),
        sealedBody: t("awaitingSelfBody"),
        turnKey: t("turnKey"),
        workingTitle: t("workingTitle"),
        workingBody: t("workingBody"),
        waitingTitle: t("awaitingPartnerTitle"),
        waitingBody: t("awaitingPartnerBody"),
        readyTitle: t("readyTitle"),
        readyBody: t("readyBody"),
        reveal: t("reveal"),
        revealedTitle: t("title"),
        accentNone: t("heroAccentNone"),
        accentOne: t("heroAccentShared", { count: 1 }),
        accentMany: t.raw("accentMany"),
        withPartner: t("with", { name: partnerName }),
        sealedBadge: t("sealedBadge"),
        youAgreed: t("youAgreed"),
        bothAgreed: t("bothAgreed"),
        agreed: t("agreedStatus"),
        notYet: t("notYetStatus"),
        waiting: t("waitingStatus"),
        partner: t("partner"),
        dualKeyLabel: t("dualKeyLabel"),
        demoSwitch: t("demoSwitch", { name: partnerName }),
        statShared: t("statShared"),
        statCombined: t("statCombined"),
        statSeen: t("statSeen"),
        sharedTitle: t.raw("sharedTitle"),
        perPregnancy: t.raw("perPregnancy"),
        carrierChance: t.raw("carrierChance"),
        combinedTitle: t("combinedTitle"),
        combinedBody: t("combinedBody"),
        combinedHow: t("combinedHow"),
        hundredSummary: t.raw("hundredSummary"),
        notAffected: t("notAffected"),
        noneSharedTitle: t("noneSharedTitle"),
        noneSharedBody: t("noneSharedBody"),
        residual: pick(LIMITS.items[1].body, locale),
        nadTitle: pick(NOT_A_DIAGNOSIS.title, locale),
        nadBody: pick(NOT_A_DIAGNOSIS.body, locale),
        privacyNote: t("privacyNote"),
        deviceNote: t("deviceNote"),
        serverSees: t.raw("serverSees"),
        talkShare: t("talkShare"),
        talkShareNote: t("talkShareNote"),
        talk: t("talk"),
        errorTitle: te("title"),
        errorBody: t("errorBody"),
        tryAgain: tc("tryAgain"),
      }}
    />
  );
}
