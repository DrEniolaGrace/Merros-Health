import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page";
import { CRISIS_PLACEHOLDERS, DISTRESS_SUPPORT } from "@/content/values";
import { pick } from "@/content/types";
import { distressBand, type CallbackKind } from "@/lib/wellbeing/distress";
import { DistressCheck } from "./distress-check";

export default async function WellbeingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("wellbeing");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const tc = await getTranslations("common");
  const latest = await prisma.distressScore.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const support = (b: "low" | "moderate" | "high") => ({ title: pick(DISTRESS_SUPPORT[b].title, locale), body: pick(DISTRESS_SUPPORT[b].body, locale), tips: DISTRESS_SUPPORT[b].tips.map((x) => pick(x, locale)) });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={tp("eyebrowWellbeing")} title={t("title")} body={t("body")} label={{ kind: "education", text: ts("education") }} />
      <DistressCheck
        initial={latest ? { score: latest.score, band: distressBand(latest.score), callback: (latest.callback as CallbackKind | null) ?? null } : null}
        labels={{
          question: t("question"),
          hint: t("hint"),
          low: t("low"),
          high: t("high"),
          valueText: t.raw("valueText"),
          save: t("save"),
          again: t("again"),
          callbackTitle: t("callbackTitle"),
          callbackBody: t("callbackBody"),
          counsellor: t("counsellor"),
          psychologist: t("psychologist"),
          callbackDone: { counsellor: t("doneCounsellor"), psychologist: t("donePsychologist") },
          crisisTitle: t("crisisTitle"),
          crisis: CRISIS_PLACEHOLDERS.map((c) => pick(c, locale)),
          crisisNote: t("crisisNote"),
          book: t("book"),
          support: { low: support("low"), moderate: support("moderate"), high: support("high") },
        }}
      />
      <p className="measure text-xs text-muted">{t("privacy")} · {tc("pendingReview")}</p>
    </div>
  );
}
