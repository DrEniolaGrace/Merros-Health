# Privacy and data governance

## Principles

* Each person owns their data. **Nothing is shared by default**; every consent switch starts off.
* Granular, plain language consent recorded as who, what (scope), recipient, purpose, granted at, expires at and revoked at.
* The right not to know: a person can decline to see their result, and can decline reclassification recontact.
* Relatives will be stored by relationship label only, never by name (Family Risk Engine, Phase 3).
* Partners see only genes they both carry, never each other's full result.
* No identifiers are ever sent to an AI model (Phase 2 onward).
* Population statistics use differential privacy with suppression of groups smaller than 10 (Phase 4). Never broken down by tribe, family name or any identity group that could stigmatise.
* Meros does not track marriage outcomes or any single personal decision as a success measure.

## Consent purposes (Phase 1)

| Purpose | Recipient | Scope | Default duration |
|---|---|---|---|
| view_own_result | self | own_result | until withdrawn |
| couple_comparison | partner | shared_carrier_genes_only | 90 days |
| counsellor_access | counsellor | result_and_journey | 90 days |
| aggregate_analytics | health system (aggregate) | anonymous_events | 1 year |
| reclassification_recontact | counsellor | variant_updates | 1 year |

All reads of a result pass the single consent gate (`lib/consent/check.ts`, 10 tests). Couple analysis requires both partners' active consent (Dual Key).

## Person controls (Privacy screen)

* Turn any consent on or off (revocation is immediate and logged).
* "Who has seen my data": the person's own audit entries, with the actor named (you, Meros automatic, a named counsellor, or a partner viewing the couple result).
* Verify the integrity of the access record.
* Download all data as readable JSON (`/api/export`; never includes keys).
* Delete all data with typed confirmation (cascade delete; anonymous audit rows remain for verifiability).

## Data residency

Production: Azure UAE North. Development: Neon (eu-central-1) with synthetic data only.
