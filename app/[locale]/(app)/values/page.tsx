import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page";
import { hasActiveConsent } from "@/lib/consent/check";
import { decryptString } from "@/lib/crypto/fieldEncryption";
import { userDataKey } from "@/lib/crypto/keys";
import { OPTIONS, seededShuffle } from "@/content/options";
import { IMPORTANCE, SURE_ITEMS, VALUES, VALUE_KEYS, type OptionId, type ValueKey } from "@/content/values";
import { pick } from "@/content/types";
import { validRatings, validSure, type Ratings, type SureAnswers } from "@/lib/values/compass";
import { ValuesCompass } from "./values-compass";

export default async function ValuesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("values");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");

  const [latest, consents] = await Promise.all([
    prisma.valuesAssessment.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.consent.findMany({ where: { userId: user.id } }),
  ]);
  let initial: { ratings: Ratings; sure: SureAnswers; share: boolean } | null = null;
  if (latest) {
    const data = JSON.parse(decryptString(latest.encData, userDataKey(user), `values:${user.id}`)) as { ratings: unknown; sure: unknown };
    if (validRatings(data.ratings) && validSure(data.sure)) initial = { ratings: data.ratings, sure: data.sure, share: hasActiveConsent(consents, "values_summary_share") };
  }
  // Same per person order as the Options Explorer, so no option is ever "first" for everyone.
  const ordered = seededShuffle(OPTIONS, user.profile?.presentationSeed ?? 1);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={tp("eyebrowValues")} title={t("title")} body={t("body")} label={{ kind: "decision_support", text: ts("decision_support") }} />
      <ValuesCompass
        initial={initial}
        order={ordered.map((o) => o.optionId as OptionId)}
        labels={{
          rateTitle: t("rateTitle"),
          rateBody: t("rateBody"),
          values: Object.fromEntries(VALUE_KEYS.map((k) => [k, { title: pick(VALUES[k].title, locale), body: pick(VALUES[k].body, locale) }])) as Record<ValueKey, { title: string; body: string }>,
          importance: IMPORTANCE.map((i) => pick(i, locale)),
          relateTitle: t("relateTitle"),
          relateBody: t("relateBody"),
          relateEmpty: t("relateEmpty"),
          options: Object.fromEntries(OPTIONS.map((o) => [o.optionId, pick(o.title, locale)])) as Record<OptionId, string>,
          fits: t("fits"),
          tension: t("tension"),
          depends: t("depends"),
          noneImportant: t("noneImportant"),
          sureTitle: t("sureTitle"),
          sureBody: t("sureBody"),
          sureItems: SURE_ITEMS.map((i) => ({ key: i.key, text: pick(i.text, locale) })),
          yes: tc("yes"),
          no: tc("no"),
          shareLabel: t("shareLabel"),
          shareDesc: t("shareDesc"),
          save: t("save"),
          saved: t("saved"),
          sureAll: t("sureAll"),
          sureSome: t("sureSome"),
          talk: t("talk"),
          incomplete: t("incomplete"),
        }}
      />
      <p className="measure text-xs text-muted">{t("source")} · {tc("pendingReview")}</p>
    </div>
  );
}
