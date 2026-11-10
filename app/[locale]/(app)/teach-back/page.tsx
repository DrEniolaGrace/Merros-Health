import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page";
import { TEACHBACK } from "@/content/teachback";
import { pick } from "@/content/types";
import { Quiz } from "./quiz";

export default async function TeachBackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(["patient"]);
  const t = await getTranslations("teachback");
  const tp = await getTranslations("page");
  const ts = await getTranslations("safety");
  const attempts = await prisma.teachBackAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { questionId: true, correct: true } });

  const questions = TEACHBACK.map((q) => ({
    questionId: q.questionId,
    prompt: pick(q.prompt, locale),
    options: q.options.map((o) => ({ id: o.id, text: pick(o.text, locale) })),
    explanations: q.explanations.map((e) => pick(e.text, locale)),
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={tp("eyebrowTeach")} title={t("title")} body={t("body")} label={{ kind: "education", text: ts("education") }} />
      <Quiz questions={questions} initialAttempts={attempts} />
    </div>
  );
}
