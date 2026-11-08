/**
 * Teach Back logic (SPEC 4.4). Pure functions.
 * Each question has an ordered list of explanation variants. The first is the standard
 * explanation; after each wrong answer the next variant (new analogy, visual, simpler words)
 * is shown and the question is asked again.
 */
export interface TeachBackAttemptLite {
  questionId: string;
  correct: boolean;
}

/** True when any single question has been answered wrongly at least twice (escalation trigger). */
export function teachBackFailedTwice(attempts: TeachBackAttemptLite[]): boolean {
  const wrong = new Map<string, number>();
  for (const a of attempts) {
    if (!a.correct) {
      const n = (wrong.get(a.questionId) ?? 0) + 1;
      if (n >= 2) return true;
      wrong.set(a.questionId, n);
    }
  }
  return false;
}

/** Index of the explanation variant to show next for a question, capped at the last variant. */
export function nextExplanationIndex(
  attemptsForQuestion: TeachBackAttemptLite[],
  variantCount: number,
): number {
  const wrong = attemptsForQuestion.filter((a) => !a.correct).length;
  return Math.min(wrong, Math.max(variantCount - 1, 0));
}

export function isQuestionDone(attemptsForQuestion: TeachBackAttemptLite[]): boolean {
  return attemptsForQuestion.some((a) => a.correct);
}

/**
 * Comprehension scores in [0, 1].
 * before: share of questions answered correctly on the first try.
 * after: share of questions answered correctly at any point (after re explanation).
 */
export function comprehensionScores(
  questionIds: string[],
  attempts: TeachBackAttemptLite[],
): { before: number; after: number; answered: number } {
  if (questionIds.length === 0) return { before: 0, after: 0, answered: 0 };
  let before = 0;
  let after = 0;
  let answered = 0;
  for (const q of questionIds) {
    const qa = attempts.filter((a) => a.questionId === q);
    if (qa.length) answered++;
    if (qa[0]?.correct) before++;
    if (qa.some((a) => a.correct)) after++;
  }
  return { before: before / questionIds.length, after: after / questionIds.length, answered };
}
