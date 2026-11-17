# Clinical safety

All clinical content is **pending accredited clinical review**. Merros supports, and never replaces, licensed screening and genetic counselling services.

## Reference standard and gene panel

Merros follows the Department of Health, Abu Dhabi. *Premarital Screening Standard*. Document reference DoH/STD/PSS/V3, version 3, published September 2024 (revision due September 2027). https://www.doh.gov.ae/-/media/Feature/Resources/Standards/Premarital-Screening-standard-for-publication.ashx. Merros is an independent prototype. It is not affiliated with or endorsed by the Department of Health Abu Dhabi; it uses the Department's published standard as a public reference only.

* **Panel:** Appendix 12, 563 genes (`data/reference/doh-pms-panel.json`, `lib/risk/panel.ts`). Because the appendix lists autosomal recessive genes only, the risk engine treats every panel gene as autosomal recessive and computes couple chances for all of them. Genes outside both the panel and the engine's own list are never computed; they go to a counsellor. Every result shows the panel's scope: recessive genes only, not every recessive condition, and a clinical geneticist for a family condition outside the panel (Appendix 15).
* **Personas:** a unit test checks that every carrier gene a persona has is on the panel.

## Care pathway, aligned with the DoH process

Merros records the journey; the screening facility does the clinical steps. No form from the standard is reproduced.

| Official step (section 3.3, Appendices 14 and 15) | Merros |
|---|---|
| Screening visit: agreement and consent signed (genetic consent for UAE nationals), samples taken | "Screening visit" step, recorded when a signed lab result arrives |
| Physician receives and interprets results; confirmatory haemoglobin testing for abnormal results (3.4.1.3) | "Results received"; "Confirmatory haemoglobin test" shown as needed only for some people, never as "you are here" |
| (Merros addition) | "Results understood": Teach Back |
| Results counselling, each person separately and then the couple together if they agree (Appendix 14) | "Results counselling booked" and "done"; the shared carrier result message describes this |
| Positive genetic finding: the physician controls release (3.3.10.2); both sign that they were informed (3.3.13.2) | Counsellor first for Living Results and Risk Beyond the Panel; Merros never issues or replaces the declaration |
| Premarital Screening and Counselling Report issued (3.3.10), valid three months (3.3.10.5) | "Report issued" step, recorded by the counsellor; Merros never issues a report |
| Referral to a clinical geneticist or genetic counsellor; haemoglobinopathy carriers to assigned services; reproductive medicine options (3.10, Appendix 13) | "Referral, if chosen"; Find Care lists these kinds of service; escalation messages name them |
| A previous genetic result is reused with a new partner (3.3.10.7) | Each person's result is kept separately and matched with a partner's (Blind Couple Match) |

## Wording and "Your plan"

* A couple who both carry a change in the same gene have a **shared carrier result**. No screen, document or Copilot answer labels a couple as a mismatch or as unsuitable for each other. `tests/unit/wording.test.ts` scans every message file, content file, the video script, the README and these docs in both languages, and the Safety Verifier has rules (`en.couple_label`, `ar.couple_label`) that stop the Copilot from using such labels.
* Every result that carries a risk ends with **Your plan**: (1) talk it through with a genetic counsellor, (2) know every option, unranked, with the Values Compass, (3) one next step. It appears on My result (carrier, uncertain variant, or a finding that needs a counsellor), on the couple screen after a shared carrier result is revealed, and after a released Risk Beyond the Panel summary. Each plan says that Merros never tells anyone whom to marry or what to decide, and every line passes the non directive rules (tested).

## Risk Beyond the Panel (Phase 5)

Code: `lib/beyond/engine.ts` (pure, 14 unit tests), `lib/services/beyond.ts`.

* **Method.** Kinship = (share of the autosomes the partners share on one copy) / 4. A child's inbreeding coefficient F equals the parents' kinship. Added risk of a significant childhood condition = the published first cousin range (1.7 to 2.8 percentage points above the general population; Bennett et al. 2002) scaled by F / (1/16), never extended beyond twice the first cousin level. Above that the result is "individual assessment" rather than a number.
* **Never a diagnosis.** The couple's view states that it is an estimate, names no condition, and shows no kinship figure.
* **Counsellor first.** The analysis exists only while BOTH partners hold a separate consent. It is created in a "with the counsellor" state and raises the `risk_beyond_panel_result` escalation for both. The couple sees nothing until the counsellor releases it. Either partner withdrawing deletes it.
* **Unexpected relatedness.** The engine compares measured kinship with the declared relationship and tells the counsellor, only the counsellor, when they clearly differ.
* **Input data is synthetic and not from a pipeline** (see LIMITATIONS).

## Distress Check and Values Compass (Phase 5)

* **Distress Check** (`lib/wellbeing/distress.ts`): one question, 0 to 10 (NCCN Distress Thermometer). A score of 4 or more fires the existing `high_distress` escalation rule (urgent) and offers a same week callback from a genetic counsellor or a psychologist; 7 or more also shows what to do if the person feels unsafe: call their genetic counsellor or doctor, go to the nearest emergency department if they might be in danger, and stay with someone they trust. No phone numbers are listed, so none can be out of date. A unit test checks that the callback offer and the escalation rule agree for every score. A later score under 4 closes the open reason.
* **Values Compass** (`lib/values/compass.ts`, `content/values.ts`): the person rates seven values; each option is then shown with which of their important values it tends to fit, may pull against, or depends on. Nothing is scored, summed, sorted or labelled best. Tests enforce this: the output has no score or rank field, the order is the caller's (the per person shuffle of the Options Explorer), every option has at least one fit and one tension, and faith and family are never presumed. The SURE test (4 items) flags decisional conflict below 4 of 4 and offers a counsellor.
* What someone values is stored encrypted with their own data key and reaches the counsellor only through a separate consent (`values_summary_share`).

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
