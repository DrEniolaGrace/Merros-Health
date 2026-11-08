# Clinical safety

All clinical content is **pending accredited clinical review**. Meros supports, and never replaces, licensed screening and genetic counselling services.

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
| shared_pathogenic_gene | Both partners carry P/LP in the same gene (after both consent) | high |
| vus_present | Any VUS | routine |
| significant_personal_finding | P/LP in an X linked, dominant or unknown gene; homozygous or multiple P/LP in one gene | high |
| pregnant_or_trying | Pregnant (urgent) or trying to conceive (high) | urgent / high |
| high_distress | Distress Thermometer ≥ 4 (NCCN screening cut off; Distress Check is Phase 5) | urgent |
| teachback_failed_twice | Same Teach Back question wrong twice | routine |
| medical_advice_requested | Person asks for medical advice | routine |
| safety_verifier_block | Phase 2 hook | routine |
| variant_reclassified | Phase 3 hook | high |
| risk_beyond_panel_result | Phase 5 hook | high |

Result based rules run only after the person has chosen to see their result.

## Safety boundary labels

Every content block carries exactly one label: Education, Decision Support or Clinical Advice. The content type system forbids Clinical Advice in the content library; a test asserts no AI sourced item can carry it. Clinical Advice will only come from a named, accredited human (counsellor signed summaries, Phase 3).

## Content

Six condition cards (beta thalassaemia, sickle cell disease, SMA, GJB2 hearing loss, cystic fibrosis, alpha thalassaemia) at three reading levels in Arabic and English, original wording citing MedlinePlus Genetics and GeneReviews. Options Explorer shows seven options with equal weight in a per person shuffled order (tested to be unbiased); a test blocks "recommended" style wording. Teach Back has three questions with three explanation variants each.

## Non directiveness

Copy never recommends a decision. The core principle is shown on the landing page, home and onboarding. Risk numbers use calm data colours, never red.
