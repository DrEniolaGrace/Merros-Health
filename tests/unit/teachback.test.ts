import { describe, expect, it } from "vitest";
import { comprehensionScores, isQuestionDone, nextExplanationIndex, teachBackFailedTwice } from "@/lib/teachback/logic";

const a = (questionId: string, correct: boolean) => ({ questionId, correct });

describe("teach back", () => {
  it("failed twice only when the same question is wrong twice", () => {
    expect(teachBackFailedTwice([])).toBe(false);
    expect(teachBackFailedTwice([a("q1", false), a("q1", true)])).toBe(false);
    expect(teachBackFailedTwice([a("q1", false), a("q2", false)])).toBe(false);
    expect(teachBackFailedTwice([a("q1", false), a("q2", true), a("q1", false)])).toBe(true);
  });
  it("shows the next explanation after each wrong answer, capped", () => {
    expect(nextExplanationIndex([], 3)).toBe(0);
    expect(nextExplanationIndex([a("q", false)], 3)).toBe(1);
    expect(nextExplanationIndex([a("q", false), a("q", false)], 3)).toBe(2);
    expect(nextExplanationIndex([a("q", false), a("q", false), a("q", false)], 3)).toBe(2);
    expect(nextExplanationIndex([a("q", false)], 0)).toBe(0);
  });
  it("a question is done once answered correctly", () => {
    expect(isQuestionDone([a("q", false)])).toBe(false);
    expect(isQuestionDone([a("q", false), a("q", true)])).toBe(true);
  });
  it("computes before and after comprehension", () => {
    const s = comprehensionScores(["q1", "q2"], [a("q1", true), a("q2", false), a("q2", true)]);
    expect(s).toEqual({ before: 0.5, after: 1, answered: 2 });
    expect(comprehensionScores([], [])).toEqual({ before: 0, after: 0, answered: 0 });
  });
});
