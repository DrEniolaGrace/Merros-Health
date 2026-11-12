# Clinical safety

All clinical content is **pending accredited clinical review**. Merros supports, and never replaces, licensed screening and genetic counselling services.

## Risk engine (`lib/risk/engine.ts`)

Deterministic, pure and unit tested (28 tests). Language models never compute risk numbers.

* **Model:** autosomal recessive Mendelian transmission. For each parent and gene, the probability of passing on a pathogenic allele is 0 (no P/LP variant), 1/2 (one heterozygous P/LP variant) or 1 (homozygous). Per pregnancy: affected = tA·tB, carrier = tA(1−tB) + tB(1−tA), non carrier = (1−tA)(1−tB). Two carriers give 25% / 50% / 25%, independent each pregnancy.
* **Multi gene:** P(affected by at least one condition) = 1 − Π(1 − affectedᵢ). Two shared genes give 7/16 = 43.75%.
* **Exact arithmetic:** fractions, not floating point, so displayed numbers are exact.
* **Counted:** pathogenic and likely pathogenic only. **Never counted:** VUS (shown as an uncertainty and escalated), likely benign, benign.
* **Never auto computed (routed to a counsellor):** X linked, dominant or unknown genes; two different P/LP variants in one gene in one person (phase unknown); hemizygous calls in an autosomal gene; homozygous findings.
* **Couple disclosure:** only genes both partners carry are shown to the couple.
* **Not modelled yet:** residual risk after a negative result (shown as text only), alpha thalassaemia cis/trans arrangements, consanguinity beyond the panel (Risk Beyond the Panel, Phase 5).

## Escalation Engine (`lib/escalation/rules.ts`)

Rule based, auditable, 19 tests including persona snapshots. Each fired rule records a reason code and severity.

| Code | Trigger | Severity |
|---|---|---|
| shared_pathogenic_gene | Both partners carry P/LP in the same gene. Known to the server only when the person chooses to tell their counsellor after the Blind Couple Match | high |
| vus_present | Any VUS | routine |
| significant_personal_finding | P/LP in an X linked, dominant or unknown gene; homozygous or multiple P/LP in one gene | high |
| pregnant_or_trying | Pregnant (urgent) or trying to conceive (high) | urgent / high |
| high_distress | Distress Thermometer ≥ 4 (Distress Check is Phase 5), or distress language in a Copilot question | urgent |
| teachback_failed_twice | Same Teach Back question wrong twice | routine |
| medical_advice_requested | Person asks for medical advice, or asks the Copilot to decide for them | routine |
| safety_verifier_block | The Copilot's Safety Verifier replaced a draft answer | routine |
| variant_reclassified | Phase 3 hook | high |
| risk_beyond_panel_result | Phase 5 hook | high |

Result based rules run only after the person has chosen to see their result.

## Safety boundary labels

Every content block carries exactly one label: Education, Decision Support or Clinical Advice. The content type system forbids Clinical Advice in the content library; a test asserts no AI sourced item can carry it. Clinical Advice will only come from a named, accredited human (counsellor signed summaries, Phase 3).

## Content

Six condition cards (beta thalassaemia, sickle cell disease, SMA, GJB2 hearing loss, cystic fibrosis, alpha thalassaemia) at three reading levels in Arabic and English, original wording citing MedlinePlus Genetics and GeneReviews. Options Explorer shows seven options with equal weight in a per person shuffled order (tested to be unbiased); a test blocks "recommended" style wording. Teach Back has three questions with three explanation variants each.

## Non directiveness

Copy never recommends a decision. The core principle is shown on the landing page, home and onboarding. Risk numbers use calm data colours, never red.

## Living Results (`lib/living/`)

* Sources: live ClinVar through NCBI E-utilities (`pnpm variant-watch`, the scheduled job) and a mock national feed used by the demo. ClinVar descriptions are mapped to the five ACMG classes; unknown or empty descriptions are ignored, never guessed. "Conflicting" is treated as uncertain.
* When a classification changes, the lab's amended signed report is stored **unreleased**, a counsellor task is created with the old and new classification and the evidence, and an escalation waits for the counsellor.
* **The patient is told by the counsellor, never by a push notification.** Their result, risk and care page do not change until the counsellor confirms they have spoken to the person and releases the update (tested end to end).
* **Right not to know.** People without an active recontact consent are counted for the health system but never contacted, and their result is not changed.
* After release the risk engine uses the amended result, and any couple match is cleared so the couple can run it again on their phones.
* The demo reclassification of Hamad's variant is simulated and labelled as such; it is not a real ClinVar change.

## Family Risk Engine (`lib/family/engine.ts`)

Deterministic, 23 tests. Starting from a confirmed heterozygous carrier of an autosomal recessive variant:

| Relative | Chance of carrying the family variant |
|---|---|
| Parent, sibling, child | 1/2 |
| Half sibling, grandparent, aunt or uncle, niece or nephew, grandchild | 1/4 |
| First cousin | 1/8 |

* Population adjustment: P = Prel + (1 − Prel) × f, where f is the population carrier frequency for the gene.
* If a parent has been tested, the side is known: relatives on the carrier side double (parent 1, aunt or uncle 1/2, first cousin 1/4) and the other side falls to f.
* Tested relatives are certain (1 or 0) and are not ranked. Ranking is by probability, with adults planning marriage or pregnancy first among equals.
* **Approximation:** when the carrier's own parents are related, the variant could be on both sides; the engine then keeps the side unknown values rather than combining paths. New mutations are ignored. Pedigree likelihood software is the production upgrade.
* **Carrier frequencies are illustrative**, not verified against gnomAD or the Greater Middle East Variome (`lib/family/frequencies.ts`). The value used is always shown on screen.
* Relatives are stored by relationship label only. Invitation links carry a random token and the page they open names no person, gene or relationship.

## Counsellor signed summaries

The Copilot only drafts from the counsellor's own notes. The counsellor edits and signs; only the signed text reaches the patient, labelled Clinical Advice with the counsellor's name, credentials and licence number. This is the only place the Clinical Advice label appears.
