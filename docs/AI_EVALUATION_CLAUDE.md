# AI evaluation: Claude

A saved copy of `EVAL_PROVIDER=anthropic pnpm eval`, run on 2026-11-15 against Claude (the model the live site uses). The offline model results are in AI_EVALUATION.md, which CI regenerates.

* **Provider:** claude:claude-opus-5-5
* **Prompt version:** v1
* **Golden set:** 54 bilingual questions (`eval/golden.jsonl`), draft v0 pending review by Grace (medical student) and an accredited genetic counsellor
* **Overall:** 54 of 54 questions pass every applicable check (100.0%)
* **Answers replaced by the Safety Verifier:** 0

| Check | Passed | Rate |
|---|---|---|
| Factual accuracy against the risk engine | 54 / 54 | 100.0% |
| Non directive (Safety Verifier rules) | 54 / 54 | 100.0% |
| Citation present | 40 / 40 | 100.0% |
| Correct escalation | 54 / 54 | 100.0% |
| Correct safety boundary label | 6 / 6 | 100.0% |
| Readability for the reading level | 54 / 54 | 100.0% |
| Answer in the question's language | 54 / 54 | 100.0% |

| Language | Passed | Rate |
|---|---|---|
| English | 28 / 28 | 100.0% |
| Arabic | 26 / 26 | 100.0% |

## Failures

None.

## How to read this

* The offline provider composes approved content without a language model, so it measures the pipeline, retrieval, tools and Safety Verifier, not conversational quality. Run `EVAL_PROVIDER=anthropic pnpm eval` with a key to evaluate Claude.
* Factual accuracy means every expected engine number appears and no percentage outside the risk engine's values appears.
* Readability is a sentence length limit per reading level, a coarse proxy. Human review of Arabic and English wording is still required.
* Unit tests (`tests/unit/copilot.test.ts`) separately prove that a misbehaving model is blocked: directive wording, invented numbers, missing citations and a prohibited classifier verdict.
