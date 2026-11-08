# MEROS: Technical Specification and Build Brief (v4)

**For:** Claude Code
**Competition:** Future Health Digital Innovation Challenge 2026 (Abu Dhabi), Fertility Challenge 03: Understanding and Reducing Inherited Disease Risk
**Team:** Meros
**Deadline:** 20 November 2026. Submit a working prototype plus technical documentation including assumptions, dependencies and limitations.
**Scoring rubric (expert panel, top three win):** 1. Health impact and clinical relevance. 2. Technical depth and architecture. 3. Working solution and demonstration quality. 4. Responsible AI, safety and data governance. 5. Scalability and deployment readiness. 6. Commercial viability and path to pilot.

---

## 0. Instructions to Claude Code

1. Read this whole file first. Then propose an implementation plan for Phase 1 only and wait for my approval.
2. Build strictly in the phase order of Section 14. Never start a phase while an earlier one has broken flows.
3. A smaller app that works perfectly beats a bigger app that half works. No dead buttons, no lorem ipsum.
4. Synthetic data only. No real patients, clinicians or clinics. Show a "Synthetic demo data" badge on every screen.
5. All genetic risk numbers come from deterministic, unit tested code. Language models never calculate risk; they call tools that do.
6. Write tests for every safety critical component: risk engine, PSI protocol, consent checks, escalation rules, safety verifier and differential privacy.
7. Keep the docs in Section 15 updated as you build.
8. I will send design reference images later. Until then use the neutral design tokens in Section 12 so restyling is easy.

---

## 1. The problem

Abu Dhabi has invested heavily in population genomics and mandatory premarital genetic screening. Testing is solved. Understanding and acting on results is not. Genetic information is complex, probabilistic and shared across families. Misunderstood results cause anxiety, stigma, family tension or false certainty. Consanguineous marriage is a long standing cultural practice, so technology must support informed choice, never judgement or coercion. The unmet need is private, culturally and linguistically appropriate communication that links premarital and preconception screening to counselling and care, while protecting genetic data and never exposing one family member's information to another without permission.

## 2. What Meros is

**Meros is a privacy preserving genomic companion that helps individuals, couples, families and the health system identify, understand and act on inherited disease risk.** It explains results through a safe multi agent AI copilot with Gulf Arabic voice, protects couples with cryptography so nobody sees more than they consented to, keeps results up to date as science changes, extends protection to relatives without exposing anyone, and turns every interaction into privacy safe population signals the health system can act on.

### Core principle (show in app and docs)
> Meros never tells anyone whom to marry or what to decide. Success means understanding, timely access to qualified counselling, and confident personal choice. Cancelled marriages or any single personal decision are never a success measure.

### Two beneficiaries, one loop
* **The person:** understands their result, reaches a counsellor faster, decides by their own values, stays protected as science evolves.
* **The health system:** sees where people drop off, where counselling demand is rising, which languages and literacy levels are underserved, and how many people are affected when a variant is reclassified, all without seeing any individual.

---

## 2A. How Meros works (end to end)

**Step 1. Result arrives.** A licensed screening lab sends a signed result (FHIR Genomics JSON). The person gets a private invitation, signs in, chooses Arabic or English, reading level and text or voice, and gives granular consent. Nothing is shown before consent.

**Step 2. Understand it alone first.** The Risk Explainer shows their own carrier status in plain language with visuals. The Genetic Copilot answers any question by text or Gulf Arabic voice. My Result Video plays a short personalised explainer. Teach Back checks understanding and re explains if needed. Distress Check offers support straight away if the news is hard.

**Step 3. Find out what it means as a couple, privately.** Both partners press their Dual Key consent. Blind Couple Match runs on their phones and reveals only genes they share. The risk engine calculates the couple's risk per pregnancy, including multi gene risk. They can choose to reveal the result together, with a counsellor on video if they want.

**Step 4. Escalate to a human when needed.** If they share a gene, have a VUS, are pregnant, are distressed, or ask for medical advice, the Escalation Engine books a genetic counsellor. The counsellor receives a Counsellor Copilot brief, including the Risk Beyond the Panel analysis for related couples, which only the counsellor sees first.

**Step 5. Decide by their own values.** Options Explorer shows every option equally. Values Compass helps them think without directing them. Find Care connects them to counsellors, family doctors, IVF and PGT-M clinics and specialists near them, filtered by language and clinician gender. The Care Pathway Tracker shows every step.

**Step 6. Protect the family without exposing anyone.** The Family Risk Engine builds a name free family tree, ranks which relatives are most likely carriers, and lets the user send private invitations that never reveal who sent them.

**Step 7. Stay protected over time.** Living Results watches ClinVar. If a variant is reclassified, the counsellor is alerted, the couple match reruns with consent, and the counsellor contacts the person.

**Step 8. The health system learns, without seeing anyone.** Every step feeds the Population Signals Dashboard with differential privacy: drop off, time to counselling, comprehension gaps by language, counselling demand forecasts by region, reclassification impact and cascade testing yield.

---

## 3. Coverage map (keep this table updated in docs/CHALLENGE_MAPPING.md)

| Challenge element | Meros features |
|---|---|
| Identify inherited risk | Preconception Screening Finder (4.2), Risk Beyond the Panel (6.2), Family Risk Engine (6.4), Living Results (6.3) |
| Understand | Risk Explainer (4.3), Meros Genetic Copilot with voice (6.5), My Result Video (6.6), Teach Back (4.4) |
| Reduce | Options Explorer (4.5), Care Pathway and Find Care (4.9, 4.10), Family Risk Engine cascade testing (6.4) |
| Culturally appropriate | Arabic first with Gulf dialect voice, non directive safety verifier, Values Compass, optional Faith Perspectives |
| Privacy preserving | Blind Couple Match with PSI (6.1), Dual Key consent, field encryption, hash chained audit, differential privacy (7.2) |
| Desired outcome 1: Risk explanation | 4.3, 6.5, 6.6 |
| Desired outcome 2: Values sensitive choices | 4.2, 4.5, 4.6 |
| Desired outcome 3: Qualified human counselling | 4.7, 4.8, 4.11, 7.1 |
| Desired outcome 4: Privacy preserving family workflows | 4.8, 4.13, 6.1, 6.4 |
| Desired outcome 5: Safe linkage to services | 4.9, 4.10, 4.11 |
| Desired outcome 6: Measurable comprehension and access | 4.4, 7.2, METRICS.md |

---

## 4. Core product (Tier 1, must fully work)

### 4.1 Onboarding, consent and result import
* Arabic or English with full RTL. Reading level choice: Simple, Standard, Detailed. Text, audio or both.
* Granular plain language consent before any result is shown, stored as a Consent object (who, what, recipient, purpose, expiry, revokedAt). Withdraw any time.
* Simulated import of a screening result from a licensed screening lab as HL7 FHIR Genomics style JSON (DiagnosticReport plus Observation: gene, HGVS variant, zygosity, ACMG classification, ClinVar ID). **Each result is digitally signed by the issuing lab** (Ed25519 lab key in prototype). The app verifies the signature. This matters for PSI security (6.1).

### 4.2 Preconception Screening Finder
For people outside the mandatory premarital programme (already married couples, residents, people planning pregnancy): a short flow explaining who may benefit from carrier screening, what it covers, and where to get it, linking to Find Care. This covers the "identify" part of the challenge and preconception screening.

### 4.3 Risk Explainer
* Deterministic risk engine. Autosomal recessive, both partners carriers of pathogenic or likely pathogenic variants in the same gene: each pregnancy 25% affected, 50% carrier, 25% non carrier, independent per pregnancy.
* **Multi gene couple analysis:** when a couple shares more than one carrier gene, compute the combined chance that a pregnancy is affected by at least one condition: 1 minus the product of (1 minus risk per gene). Show per gene and combined.
* Visual: 100 figure grid and a 4 square grid. Permanent "Risk is not a diagnosis" panel. Honest uncertainty: what the test does not cover, residual risk, and what a VUS means.
* Condition cards (thalassaemia, SMA, and 3 to 5 more common in the region): balanced, plain language, includes available treatments and quality of life.

### 4.4 Teach Back
Two or three gentle questions after each explanation. Wrong answer triggers a different explanation (new analogy, visual, audio, or the copilot). Store before and after comprehension scores per language and reading level.

### 4.5 Options Explorer
All clinically appropriate options with equal visual weight, never ranked or labelled recommended: no change to plans; prenatal testing; IVF with PGT-M; donor gametes where permitted; adoption or fostering; not having biological children; postponing decisions until after counselling. Each card: what it involves, timing, cost placeholder, availability, questions to ask a counsellor.

### 4.6 Values Compass
Decision aid based on the Ottawa Decision Support Framework. User rates what matters (faith, family expectations, biological children, avoiding procedures, certainty, cost, time). Shows how options fit their own stated values without choosing. Includes the 4 item SURE decisional conflict screen. Optional private "My Values Summary" to share with a counsellor.

### 4.7 Safety Boundary Labels
Every content block and AI message carries one label: **Education**, **Decision Support**, or **Clinical Advice**. Clinical Advice can only come from a named, accredited human, shown with credentials. AI can never produce Clinical Advice.

### 4.8 Escalation Engine (rule based, auditable, unit tested)
Route to a human genetic counsellor and offer an appointment when any is true: shared pathogenic gene between partners; any VUS; severe, X linked or dominant finding; currently pregnant or trying to conceive; distress score at or above threshold; Teach Back failed twice; user asks for medical advice; the Safety Verifier blocks an output; Living Results reclassification; any Risk Beyond the Panel result. Each escalation records the reason.

### 4.9 Care Pathway Tracker
Timestamped journey: Result received → Understood → Counselling booked → Counselling completed → Confirmatory testing → Specialist service (if chosen). Users see where they are; the system sees drop off and time per step.

### 4.10 Find Care
Directory of fictional genetic counsellors, family doctors, IVF and PGT-M clinics, maternal fetal medicine, haematology and psychology services in Abu Dhabi, Al Ain and Al Dhafra. Profiles with credentials, languages, clinician gender, experience, services, availability, in person or video, insurance. Map with distance (Leaflet plus OpenStreetMap, synthetic coordinates). Filters: service, language, clinician gender, distance, next slot, video. "My Family Doctor" linking with one tap consented referral. Simulated booking.

### 4.11 Counselling Hub
Book in person, video or phone. Pre session question list and optional Values Summary. Working video call between patient and counsellor personas using Azure Communication Services (simulated scheduling, real call). Post session summary in the patient's language and reading level, labelled Clinical Advice, signed by the counsellor.

### 4.12 Distress Check
Single item Distress Thermometer (0 to 10) after results. High scores show calm support content and offer a same week counsellor or psychologist callback. Crisis numbers as placeholders marked "verify before release". Feeds escalation and anonymised analytics.

### 4.13 Privacy controls
Each person owns their data. Nothing shared by default. Granular, time limited, revocable sharing. "Who has seen my data" access history. Relatives stored by relationship label only. Export and delete all data from settings.

---

## 5. Demo personas (synthetic seed data)

1. **Mariam and Khalid:** first cousins, engaged, both carry pathogenic HBB variants (beta thalassaemia). Also both carry a second shared gene to demonstrate multi gene analysis. Main story.
2. **Noura:** SMA (SMN1) carrier, partner not a carrier. Reassurance without false certainty.
3. **Hamad:** carries a VUS that will be reclassified to likely pathogenic during the Living Results demo.
4. **Aisha:** Arabic only, low literacy, uses voice copilot.
5. **Sara and Omar:** already married, planning pregnancy, not in the premarital programme. Uses Preconception Finder.
6. **Dr. Layla Haddad:** fictional genetic counsellor using the Counsellor Copilot.
7. **Programme Admin:** Department of Health dashboard user.

---

## 6. Hero features (what wins)

### 6.1 Blind Couple Match (Private Set Intersection)
**What:** Partners learn whether they share a carrier gene, and which one, without either partner or the Meros server ever seeing the other's full result.

**How:**
* ECDH based PSI over ristretto255 (use `@noble/curves`), or the OpenMined PSI library (`@openmined/psi.js`) if it fits better. Each client hashes its carrier gene identifiers to curve points, blinds them with a secret scalar, exchanges via the server (which only relays opaque points), double blinds the partner's set, and compares. Output is the intersection only.
* Optional cardinality only mode: reveal just "you share N genes", then reveal which genes only after both consent again.
* **Dual Key:** the protocol only runs after both partners independently consent in their own app. Either can decline without the other being told why.
* **Input integrity:** because the gene panel is small (about 570 genes), a dishonest party could input every gene to learn the other's full list. Prevent this by only accepting inputs that match the lab signed result (4.1). Verify the signature client side and server side before the protocol runs. Document this threat and mitigation in SECURITY.md.
* "Reveal together" mode: both open the couple result at the same moment on their own phones, optionally with a counsellor on video.
* After intersection, the deterministic risk engine (4.3) computes couple risk locally.
* Tests: correctness on synthetic sets, server never receives plaintext, protocol refuses unsigned inputs.

**Where it is used:** preconception couples, couples rechecking after a reclassification (6.3), and any couple who wants to compare results privately inside Meros.

### 6.2 Risk Beyond the Panel (runs of homozygosity)
**What:** Standard panels only test known variants. Couples who are related share longer identical stretches of DNA, which carries extra recessive risk that panels cannot see. Meros estimates this residual risk from whole genome data.

**How:**
* Python microservice (FastAPI, in its own Docker container) with a pipeline over synthetic VCFs: generate synthetic genomes for personas with msprime (or by recombining real 1000 Genomes haplotypes) and simulate a pedigree so related couples genuinely share segments by descent. Call ROH with `bcftools roh` or PLINK `--homozyg`, estimate pairwise kinship with KING (or PLINK `--genome` in prototype), and derive the expected inbreeding coefficient of a child (equal to the parents' kinship coefficient; for first cousins about 1/16, so about 6.25% of the genome expected to be homozygous by descent).
* Translate into a clear residual risk band with references and uncertainty. Never present as a diagnosis.
* **Counsellor only first:** kinship estimates can reveal undisclosed or unexpected relatedness. Results go to the counsellor first, who decides how to release. Explicit separate consent required.
* If live pipeline is too slow for the demo, precompute persona results and show the pipeline running on a small chromosome segment.

### 6.3 Living Results (variant reclassification watch)
**What:** Genetic science changes. A VUS today may be reclassified tomorrow. There is no good system to recontact people. Meros watches for reclassification and closes the loop through the counsellor.

**How:**
* `VariantWatch` scheduled job queries ClinVar (NCBI E utilities, by ClinVar variation ID) and a mock local reclassification feed (representing national data). Compare current classification against stored classification.
* On change: create a counsellor task with old versus new classification and evidence summary; rerun couple analysis (6.1) if the couple has consented to updates; escalate (4.8). The patient is told by the counsellor, never by a raw push notification.
* Patient controls whether they want to be recontacted about reclassifications at all (right not to know).
* Demo button in Judge Tour: "Simulate ClinVar update" reclassifies Hamad's VUS and shows the whole chain react: counsellor task, recalculated risk, pathway update, dashboard counter.
* Health system view: number of people affected by each reclassification, without identities.

### 6.4 Family Risk Engine (privacy preserving cascade screening)
**What:** When someone is a carrier, relatives have a raised chance of being carriers too. Meros calculates which relatives are most worth testing, without storing names, and lets the user invite them without exposing who they are.

**How:**
* Pedigree builder storing relationship labels only (for example "paternal aunt").
* Deterministic Mendelian probabilities for autosomal recessive carriers, given a confirmed carrier: parent 1/2 each (one is an obligate carrier, side unknown), full sibling 1/2, aunt or uncle on unknown side 1/4, first cousin 1/8, adjusted for population carrier frequency: P = Prel + (1 minus Prel) times f. If the side is known from parental testing, update the probabilities. In consanguineous pedigrees with relatives on both sides, combine paths correctly (document the approximation, and name pedigree likelihood software as the production upgrade).
* Rank relatives by carrier probability and reproductive relevance (for example adults planning marriage), shown as an interactive family graph.
* User controlled private invitation link for relatives that never names the sender. Relatives get their own private onboarding and Preconception Finder.
* Health system output: expected cascade testing yield, aggregated with differential privacy (7.2).

### 6.5 Meros Genetic Copilot (multi agent AI with Gulf Arabic voice)
**What:** A conversational copilot that explains any part of a result, risk, option or process, in text or voice, safely.

**Agents (orchestrated pipeline):**
1. **Orchestrator:** routes the question, maintains context, decides when to escalate.
2. **Variant Interpreter:** grounded only in tools: ClinVar lookup, the local content library, an ACMG evidence summariser, and the deterministic risk engine. Never computes numbers itself.
3. **Explainer:** adapts to reading level and language using approved content, with citations to content IDs.
4. **Cultural and Dialect Adapter:** rewrites for natural Gulf Arabic and culturally respectful phrasing.
5. **Safety Verifier:** two stages. A rules layer blocks directive or stigmatising phrases in Arabic and English (for example "you should not marry", "bad genes", "defective", "the right choice is"). A model classifier labels each output Education, Decision Support, or prohibited (directive, diagnostic, coercive). Prohibited outputs are rewritten or replaced with an escalation offer and logged.
6. **Escalation Agent:** applies 4.8 rules and books a counsellor when needed.

**Voice mode:** real time speech in Gulf Arabic and English using Azure AI Speech: speech to text with ar-AE and en-US locales, and UAE Arabic neural text to speech voices (check the current ar-AE voice list in the Azure portal). Browser Web Speech API only as a fallback for local development without keys.

**Evaluation harness (big for the Responsible AI score):** a golden set of at least 50 bilingual test questions with expected properties. Automated scoring for factual accuracy against the risk engine, non directiveness (Safety Verifier pass rate), citation presence, and readability. Run it in CI and publish results in docs/AI_EVALUATION.md.

**Provider abstraction:** `/lib/ai/provider.ts`. Default Claude, called through Microsoft Foundry on Azure if available in your subscription and region, otherwise the Anthropic API directly. Model name and endpoint set in environment variables. Document Jais as an Arabic model option. Prompts versioned in `/lib/ai/prompts/`. No identifiers ever sent to the model; send only the minimum de identified content.

### 6.6 My Result Video
**What:** A 60 to 90 second personalised animated explainer of the user's own result in their language, which they can rewatch or choose to show family.

**How:** Remotion (React based video rendering) templates with data driven scenes: what being a carrier means, the couple grid, options overview, next step. Narration via Azure AI Speech, bilingual captions. Contains no names or identifiers. Rendered on demand by an Azure Container Apps job (Remotion renderer in Docker), stored encrypted in Azure Blob Storage, shareable only by the user with time limited links. If server rendering is too slow for the demo, use a pre rendered persona video plus a live in browser Remotion Player preview.


---

## 7. Health system layer

### 7.1 Counsellor Copilot
Case queue sorted by urgency (pregnant, Living Results changes, VUS, high distress first) with escalation reasons. Auto generated pre session brief: results, couple PSI outcome (if consented), Risk Beyond the Panel (counsellor only), teach back scores, questions, values summary if shared, distress score, auto drawn pedigree. Post session: counsellor notes become a patient friendly summary drafted by the copilot; counsellor must review and sign before release. The counsellor always decides.

### 7.2 Population Signals Dashboard (differential privacy)
**What:** Like routine care becoming real time population signals, every Meros interaction becomes privacy safe intelligence for the Department of Health.

**How:**
* Events stream into an aggregate store. Every published statistic uses differential privacy (Laplace or Gaussian mechanism; use OpenDP or a carefully tested implementation) with a tracked privacy budget, plus suppression of any group smaller than 10.
* Signals: funnel and time to counselling by region; counselling demand forecast for the next 8 weeks per region (simple time series model) so the system can staff counsellors in advance; comprehension gaps by language and reading level; Living Results impact counts; cascade testing yield; SURE and distress trends before and after counselling; Safety Verifier block rates.
* Never break down by tribe, family name or any identity group that could create stigma.
* Visible statement: "Meros does not track marriage outcomes or any single personal decision as a success measure."

---

## 8. Supporting features (Tier 3, build if time allows)
* Conversation Rehearsal Room: practise telling a fiancé or parents with an AI role play partner.
* Faith and Family Perspectives: optional library, content to be sourced from official religious authorities (placeholder text clearly marked).
* Lived Experience Library: consented stories of families on different paths (synthetic in prototype).
* Pregnancy pathway with gestational age and time sensitive prenatal testing windows, labelled for clinical verification.
* Genetic Passport: time limited QR sharing of carrier summary with any clinician.

## 9. Roadmap (docs only, do not build)
Emirati calibrated penetrance and allele frequencies; IVF outcome simulator; newborn screening bridge; federated learning across clinics; pharmacogenomics integration; UAE Pass login.

---

## 10. Judge Tour
Floating button. Guided five minute walkthrough that switches personas and narrates what each screen proves, mapped to the six desired outcomes and six scoring criteria. Must include: Blind Couple Match live, Copilot voice question in Arabic, Simulate ClinVar update, Family Risk Engine graph, Risk Beyond the Panel (counsellor view), My Result Video, Population Signals dashboard.

---

## 11. Architecture

* **Web app:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui, installable PWA. next-intl with RTL.
* **Genomics service:** Python FastAPI with bcftools, PLINK, KING (Docker image).
* **Database:** PostgreSQL with Prisma, pgvector for retrieval. Azure Container Apps jobs for scheduled and on demand work (VariantWatch nightly, video rendering, ROH pipeline).
* **Crypto:** @noble/curves (PSI, signatures), Ed25519 lab and issuer keys, AES 256 GCM field encryption with per user data keys wrapped by a master key (env key locally, Azure Key Vault in production).
* **AI:** provider abstraction, Claude default, retrieval over curated content, Azure AI Speech for voice.
* **Video:** Remotion.
* **Audit:** append only, hash chained access log with an integrity verification button.
* **Deployment:** `docker compose up` locally (web, genomics service, Postgres). Production on Azure in the UAE North region: Azure Container Apps (web app and genomics service), Container Apps jobs, Azure Database for PostgreSQL Flexible Server with pgvector, Azure Blob Storage, Azure Key Vault, Azure AI Speech, Azure Communication Services (video consults), Azure Monitor and Application Insights. Infrastructure as code with Bicep, and a GitHub Actions workflow that builds images, pushes to Azure Container Registry, and deploys.
* **Interoperability:** FHIR Genomics style result import; documented integration points for Malaffi, UAE Pass and UAE Verify.

### Data model (adapt as needed)
User, Profile, LabResult (signed), Variant, CoupleLink, DualKeyConsent, PsiSession, Consent, Share, AccessLog (hash chained), ContentItem, TeachBackAttempt, ValuesAssessment, SureScore, DistressScore, Escalation, Clinician, Clinic, Appointment, CounsellorNote, PatientSummary, PedigreeNode, RelativeInvite, ReclassificationEvent, RohAnalysis, VideoAsset, AggregateEvent, PrivacyBudgetLedger, GuardEvent.

---

## 11A. Data and reference sources (where every piece of data comes from)

All patient data is synthetic. Reference data comes from public sources. Store downloaded reference files in `/data/reference/` with a SOURCES.md noting version and download date.

| Need | Source | How to use it |
|---|---|---|
| Variant classifications for personas and Living Results | ClinVar via NCBI E utilities (esearch and esummary on db=clinvar, by variation ID). Free; an NCBI API key raises rate limits | Pick real, well known variants for persona results (for example common HBB beta thalassaemia variants seen in the Gulf, SMN1 deletion for SMA). Store the ClinVar variation ID with each variant |
| Population allele and carrier frequencies | gnomAD (GraphQL API or downloads), and the Greater Middle East Variome where available | Supply the population carrier frequency f in the Family Risk Engine; show source and population used |
| Synthetic genomes for Risk Beyond the Panel | msprime (Python coalescent simulator) or recombined haplotypes from the public 1000 Genomes Project VCFs | Simulate a small pedigree (grandparents → siblings → first cousin couple) so related personas share genuine segments by descent. Restrict to a few chromosomes to keep runtime short |
| ROH and kinship tools | bcftools roh, PLINK 1.9 or 2 (`--homozyg`, `--genome`), KING | Install in the genomics Docker image; pin versions in DEPENDENCIES.md |
| Condition explanations | MedlinePlus Genetics and GeneReviews (NCBI Bookshelf) | Write original plain language summaries citing these as sources. Do not copy text |
| Variant classification framework | ACMG and AMP variant interpretation guidelines | Used by the Variant Interpreter agent to summarise evidence categories |
| Decision support instruments | Ottawa Decision Support Framework and the SURE test; NCCN Distress Thermometer | Use item wording per their published terms and cite them |
| Clinician and clinic directory | Generated synthetic data with Faker plus hand written Arabic and English names, placed at synthetic coordinates in Abu Dhabi, Al Ain and Al Dhafra | Mark every record synthetic |
| Copilot evaluation set | Hand written by Grace (medical student) covering 50+ bilingual questions | Stored in `/eval/golden.jsonl` |

Seed script: `pnpm seed` loads personas, lab signed results, clinicians, content library and synthetic events (about 2,000 anonymous journeys) so the Population Signals Dashboard has realistic data on day one.

## 11B. Accounts, keys and setup checklist

1. **GitHub** repository (private until submission).
2. **Azure for Students** subscription (credits without a credit card). Create a resource group in **UAE North**.
3. In Azure create: Container Registry, Container Apps environment, PostgreSQL Flexible Server (enable the pgvector extension), Storage account (Blob), Key Vault, AI Speech resource, Communication Services resource, Application Insights.
4. **AI model access:** Claude through Microsoft Foundry if offered in your subscription and region; otherwise an Anthropic API key. Store in Key Vault.
5. **NCBI API key** for ClinVar.
6. Environment variables (documented in `.env.example`): DATABASE_URL, ENCRYPTION_MASTER_KEY, LAB_SIGNING_PUBLIC_KEY, AI_PROVIDER, AI_ENDPOINT, AI_API_KEY, AI_MODEL, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, ACS_CONNECTION_STRING, BLOB_CONNECTION_STRING, NCBI_API_KEY, GENOMICS_SERVICE_URL.
7. Local development: `docker compose up` runs web, genomics service and Postgres with mock keys so everything works offline except voice, video calls and live ClinVar, which fall back to recorded responses.
8. Deployment: `infra/main.bicep` plus `.github/workflows/deploy.yml`.

---

## 12. Design tokens (until my images arrive)
Calm, private, dignified. Warm sand background #F3EFE8, deep teal primary #1F5C5C, soft clay accent #9C7A6B, text #3A3A3A, as CSS variables. IBM Plex Sans Arabic with IBM Plex Sans. No red alarm colours for risk. Mobile first at 375px. One main action per screen. When I send images, match them without breaking functionality or accessibility.

---

## 13. Legal and regulatory alignment (docs/REGULATORY.md)
Document, as design intent subject to legal review:
* Federal Decree Law No. 49 of 2023 regulating the use of the human genome: consent, confidentiality of genetic data, right to know results and to withdraw.
* UAE personal data protection law: health and genetic data are sensitive; explicit consent, purpose limitation, security.
* Premarital screening: results are confidential and disclosed to couples with consent; couples may still marry after informed counselling. Meros works alongside licensed screening and counselling services and never replaces them.
* Data residency in a UAE cloud region.

---

## 14. Build phases (17 days, cut from the bottom if needed)

**Phase 1 (by 9 Nov):** setup, i18n and RTL, auth, personas, signed result import, consent, Risk Explainer with multi gene, Teach Back, Options Explorer, boundary labels, Escalation Engine with tests, Care Pathway, privacy controls, Judge Tour skeleton.

**Phase 2 (by 12 Nov):** Blind Couple Match with Dual Key and tests. Meros Genetic Copilot (text) with Safety Verifier and evaluation harness.

**Phase 3 (by 15 Nov):** Living Results with ClinVar simulation. Family Risk Engine. Find Care, Counselling Hub, Counsellor Copilot.

**Phase 4 (by 17 Nov):** Population Signals Dashboard with differential privacy. Azure AI Speech voice mode. First Azure deployment.

**Phase 5 (by 19 Nov):** Risk Beyond the Panel (precomputed if needed), My Result Video, Distress Check, design images applied, final Azure deployment, full Judge Tour, demo video recording.

**20 Nov:** submit.

---

## 15. Required documentation (/docs)
README (run in under 5 minutes, demo logins, Judge Tour), ARCHITECTURE (Mermaid diagrams), SECURITY (PSI threat model, encryption, keys), PRIVACY_AND_DATA_GOVERNANCE, RESPONSIBLE_AI, AI_EVALUATION (harness results), CLINICAL_SAFETY (risk engine, escalation rules, content review), REGULATORY, ASSUMPTIONS, DEPENDENCIES, LIMITATIONS (synthetic data, content pending accredited review, simulated integrations, kinship estimates are approximations), METRICS, PILOT_PLAN (3 month pilot in two Abu Dhabi screening centres), COMMERCIAL (licence per screened couple, counsellor copilot seats, programme dashboard licence; scalable across GCC, MENA and South Asia), CHALLENGE_MAPPING.

## 16. Definition of done
A judge opens the link on a phone, taps Judge Tour, and sees every desired outcome and every hero feature working in about five minutes. Arabic and English fully work. Safety critical tests pass. Docs are complete and honest. Runs locally with one command and is deployed to a public URL.
