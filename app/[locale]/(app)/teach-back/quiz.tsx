"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

const EASE = [0.22, 1, 0.36, 1] as const;

export function Quiz({ questions, initialAttempts }: { questions: Q[]; initialAttempts: TeachBackAttemptLite[] }) {
  const t = useTranslations("teachback");
  const [attempts, setAttempts] = useState<TeachBackAttemptLite[]>(initialAttempts);
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  /** The question just answered correctly: it stays on screen with its confirmation until "Next". */
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const nextIndex = useMemo(
    () => questions.findIndex((q) => !isQuestionDone(attempts.filter((a) => a.questionId === q.questionId))),
    [attempts, questions],
  );
  const index = confirmed ? questions.findIndex((q) => q.questionId === confirmed) : nextIndex;
  const done = !confirmed && nextIndex === -1;
  const q = done ? null : questions[index];
  const mine = q ? attempts.filter((a) => a.questionId === q.questionId) : [];
  const shownIndex = q ? (confirmed ? Math.max(0, nextExplanationIndex(mine.filter((a) => !a.correct), q.explanations.length)) : nextExplanationIndex(mine, q.explanations.length)) : 0;
  const explanation = q ? q.explanations[shownIndex] : "";
  const isLast = nextIndex === -1;

  // Bring feedback into view so it is never missed (DESIGN.md: one main action, within reach).
  useEffect(() => {
    if (confirmed) feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (wrong) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [confirmed, wrong]);

  function submit() {
    if (!q || !choice) return;
    start(async () => {
      const r = await answerTeachBack(q.questionId, choice, nextExplanationIndex(mine, q.explanations.length));
      setAttempts((a) => [...a, { questionId: q.questionId, correct: r.correct }]);
      if (r.correct) {
        setConfirmed(q.questionId);
        setWrong(false);
      } else {
        setWrong(true);
        setChoice(null);
      }
    });
  }

  function next() {
    setConfirmed(null);
    setChoice(null);
    setWrong(false);
  }

  if (done) {
    const s = comprehensionScores(questions.map((x) => x.questionId), attempts);
    const total = questions.length;
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
        <GlassCard hero tone="gold" className="flex flex-col items-start gap-4">
          <CheckCircle size={40} className="text-gold-ink" />
          <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
          <p className="text-muted tabular">{t("doneBody", { before: Math.round(s.before * total), after: Math.round(s.after * total), total })}</p>
          {teachBackFailedTwice(attempts) && <p className="text-ink">{t("doneEscalated")}</p>}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <LinkButton href="/options" size="lg" iconEnd={<ArrowRight size={20} />}>{t("toOptions")}</LinkButton>
            <LinkButton href="/support" variant="secondary" size="lg">{t("toCare")}</LinkButton>
            <Button variant="ghost" onClick={() => start(async () => { await resetTeachBack(); setAttempts([]); next(); })}>{t("tryAgain")}</Button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  const correctOption = confirmed ? q!.options.find((o) => o.id === choice) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gold-ink tabular">{t("question", { n: index + 1, total: questions.length })}</p>
        <Steps total={questions.length} current={index + (confirmed ? 1 : 0)} label={t("title")} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          ref={cardRef}
          key={`${q!.questionId}-${confirmed ? "ok" : mine.length}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="scroll-mt-32"
        >
          <GlassCard tone={confirmed ? "gold" : "default"} className="flex flex-col gap-6">
            {!confirmed && (
              <div className={wrong ? "glass rounded-control p-4" : ""}>
                {wrong && (
                  <p className="mb-2 flex items-center gap-2 text-sm text-gold-ink" role="status">
                    <Lightbulb size={18} />
                    {t("notQuite")}
                  </p>
                )}
                <p className="measure text-ink">{explanation}</p>
              </div>
            )}

            {confirmed ? (
              <div className="flex flex-col gap-2">
                <p className="text-lg font-medium text-ink">{q!.prompt}</p>
                <p className="glass flex items-center gap-3 rounded-control px-4 py-3 text-ink">
                  <CheckCircle size={20} weight="fill" className="shrink-0 text-cyan-ink" />
                  {correctOption?.text}
                </p>
              </div>
            ) : (
              <ChoiceGroup legend={q!.prompt} value={choice} onChange={setChoice} options={q!.options.map((o) => ({ value: o.id, label: o.text }))} />
            )}

            <AnimatePresence mode="wait">
              {confirmed ? (
                <motion.div
                  key="ok"
                  ref={feedbackRef}
                  role="status"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="flex flex-col gap-4 rounded-card border border-[color-mix(in_oklab,var(--data-cyan)_40%,transparent)] bg-[color-mix(in_oklab,var(--data-cyan)_10%,transparent)] p-5 shadow-[0_0_48px_-16px_var(--data-cyan)]"
                >
                  <p className="flex items-center gap-3 text-xl font-semibold text-cyan-ink">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}>
                      <CheckCircle size={32} weight="fill" />
                    </motion.span>
                    {t("correct")}
                  </p>
                  <p className="measure text-ink">{q!.explanations[0]}</p>
                  <Button size="lg" iconEnd={<ArrowRight />} onClick={next} className="self-start" autoFocus>
                    {isLast ? t("seeResults") : t("next")}
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="submit" exit={{ opacity: 0 }}>
                  <Button size="lg" disabled={!choice} pending={pending} onClick={submit}>
                    {t("submit")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
