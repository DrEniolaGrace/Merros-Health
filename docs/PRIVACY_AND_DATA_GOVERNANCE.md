# Privacy and data governance

## Principles

* Each person owns their data. **Nothing is shared by default**; every consent switch starts off.
* Granular, plain language consent recorded as who, what (scope), recipient, purpose, granted at, expires at and revoked at.
* The right not to know: a person can decline to see their result, and can decline reclassification recontact.
* Relatives will be stored by relationship label only, never by name (Family Risk Engine, Phase 3).
* Partners see only genes they both carry, never each other's full result.
* No identifiers are ever sent to an AI model (Phase 2 onward).
* Population statistics use differential privacy with suppression of groups smaller than 10 (Phase 4). Never broken down by tribe, family name or any identity group that could stigmatise.
* Merros does not track marriage outcomes or any single personal decision as a success measure.

## Consent purposes (Phase 1)

| Purpose | Recipient | Scope | Default duration |
|---|---|---|---|
| view_own_result | self | own_result | until withdrawn |
| couple_comparison | partner | shared_carrier_genes_only | 90 days |
| counsellor_access | counsellor | result_and_journey | 90 days |
| aggregate_analytics | health system (aggregate) | anonymous_events | 1 year |
| reclassification_recontact | counsellor | variant_updates | 1 year |
| family_doctor_referral | family doctor | carrier_summary | 90 days |

All reads of a result pass the single consent gate (`lib/consent/check.ts`, 10 tests). Couple analysis requires both partners' active consent (Dual Key).

## Family and referrals (Phase 3)

* Relatives are stored by relationship label, side and testing status only. No name, contact detail or date of birth is collected.
* A private invitation is a random token. The page it opens does not show the sender, the gene or the relationship, and records only that it was opened. Merros never contacts relatives itself.
* Linking a family doctor shares nothing by default. A carrier summary is shared only if the person switches on a separate, 90 day, revocable consent in the same step.
* Session questions, counsellor notes and signed summaries are encrypted with the patient's data key. A counsellor's brief is built only with an active `counsellor_access` consent, and every build is written to the audit log.
* The couple match outcome appears in the counsellor's brief only if the patient chose to share it.

## Person controls (Privacy screen)

* Turn any consent on or off (revocation is immediate and logged).
* "Who has seen my data": the person's own audit entries, with the actor named (you, Merros automatic, a named counsellor, or a partner viewing the couple result).
* Verify the integrity of the access record.
* Download all data as readable JSON (`/api/export`; never includes keys).
* Delete all data with typed confirmation (cascade delete; anonymous audit rows remain for verifiability).

## Population Signals: differential privacy (Phase 4)

Code: `lib/signals/` (`dp.ts`, `release.ts`, `store.ts`). Tests: `tests/unit/signals.test.ts`.

* **What is collected.** With the "anonymous statistics" consent only, a journey step, a first Teach Back result or a Copilot question becomes one row in the aggregate store: event kind, region, language, reading level, time. No user id is stored; a keyed hash (HMAC with the master key) stands in, so one person's contribution can be bounded and can be deleted with "Delete my data". Never recorded: tribe, family name, nationality, or any identity group.
* **Privacy unit.** One journey (one person), over one budget period (a calendar quarter).
* **Mechanism.** Every published number is a count of journeys. Each journey is first limited in what it can add (for example at most 3 Copilot questions, one region, one language and level). Discrete Laplace noise with scale `sensitivity / ε` is then added to every cell. Sensitivity is the largest total change one journey can make across all cells of a signal, and a test checks each declared value.
* **Budget.** A release has seven signals costing ε 2.0 in total (sequential composition). The budget for a quarter is ε 6. The check and the ledger write happen in one locked transaction, and a release that does not fit is refused. Every spend is in `PrivacyBudgetLedger`.
* **Small groups.** Any cell under 10 after noise is hidden. Percentages are withheld when the denominator is less than 8 times the noise.
* **No repeated sampling.** The dashboard shows the stored release. True counts are never stored or displayed.
* **Post processing only:** funnel consistency, regional shares, the demand forecast and the staffing hint use published numbers, so they cost no budget.
* **Not measured:** marriage outcomes or any single personal decision.

Limits of this prototype are listed in docs/LIMITATIONS.md (in house implementation, floating point sampling, no external review).

## Voice (Phase 4)

With Azure AI Speech configured, the audio of a spoken question and the text of the answer are sent to the Speech resource in the configured region (UAE North by default). No name or identifier is sent, and the app does not store the audio. Without a key, speech is handled by the person's browser, and some browsers send audio to their own vendor's servers; the screen says which mode is active.

## Data residency

Production: Azure UAE North. Development: Neon (eu-central-1) with synthetic data only.
