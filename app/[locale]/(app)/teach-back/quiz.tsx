"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle, Lightbulb } from "@phosphor-icons/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { ChoiceGroup, Steps } from "@/components/ui/controls";
import { answerTeachBack, resetTeachBack } from "@/lib/actions/patient";
import { comprehensionScores, isQuestionDone, nextExplanationIndex, teachBackFailedTwice, type TeachBackAttemptLite } from "@/lib/teachback/logic";

interface Q {
  questionId: string;
  prompt: string;
  options: { id: string; text: string }[];
  explanations: string[];
}

export function Quiz({ questions, initialAttempts }: { questions: Q[]; initialAttempts: TeachBackAttemptLite[] }) {
  const t = useTranslations("teachback");
  const [attempts, setAttempts] = useState<TeachBackAttemptLite[]>(initialAttempts);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [pending, start] = useTransition();

  const index = useMemo(() => questions.findIndex((q) => !isQuestionDone(attempts.filter((a) => a.questionId === q.questionId))), [attempts, questions]);
  const done = index === -1;
  const q = done ? null : questions[index];
  const mine = q ? attempts.filter((a) => a.questionId === q.questionId) : [];
  const explanation = q ? q.explanations[nextExplanationIndex(mine, q.explanations.length)] : "";

  function submit() {
    if (!q || !choice) return;
    const shown = nextExplanationIndex(mine, q.explanations.length);
    start(async () => {
      const r = await answerTeachBack(q.questionId, choice, shown);
      setFeedback(r.correct ? "correct" : "wrong");
      setAttempts((a) => [...a, { questionId: q.questionId, correct: r.correct }]);
      if (!r.correct) setChoice(null);
    });
  }

  if (done) {
    const s = comprehensionScores(questions.map((x) => x.questionId), attempts);
    const total = questions.length;
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <GlassCard hero tone="gold" className="flex flex-col items-start gap-4">
          <CheckCircle size={40} className="text-gold-ink" />
          <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
          <p className="text-muted tabular">{t("doneBody", { before: Math.round(s.before * total), after: Math.round(s.after * total), total })}</p>
          {teachBackFailedTwice(attempts) && <p className="text-ink">{t("doneEscalated")}</p>}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <LinkButton href="/options" size="lg" iconEnd={<ArrowRight size={20} />}>{t("toOptions")}</LinkButton>
            <LinkButton href="/support" variant="secondary" size="lg">{t("toCare")}</LinkButton>
            <Button variant="ghost" onClick={() => start(async () => { await resetTeachBack(); setAttempts([]); setFeedback(null); })}>{t("tryAgain")}</Button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gold-ink tabular">{t("question", { n: index + 1, total: questions.length })}</p>
        <Steps total={questions.length} current={index + 1} label={t("title")} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${q!.questionId}-${mine.length}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <GlassCard className="flex flex-col gap-6">
            <div className={feedback === "wrong" ? "glass rounded-control p-4" : ""}>
              {feedback === "wrong" && (
                <p className="mb-2 flex items-center gap-2 text-sm text-gold-ink">
                  <Lightbulb size={18} />
                  {t("notQuite")}
                </p>
              )}
              <p className="measure text-ink">{explanation}</p>
            </div>
            <ChoiceGroup legend={q!.prompt} value={choice} onChange={(v) => { setChoice(v); }} options={q!.options.map((o) => ({ value: o.id, label: o.text }))} />
            <Button size="lg" disabled={!choice} pending={pending} onClick={submit} className="self-start">
              {t("submit")}
            </Button>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {feedback === "correct" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-cyan-ink" role="status">
            <CheckCircle size={20} />
            {t("correct")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
