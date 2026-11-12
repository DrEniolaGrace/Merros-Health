# Progress log

## Phase 1

| Date | Feature | Status | Tests |
|---|---|---|---|
| 2026-11-08 | Project setup: Next.js 15.5 (patched), pnpm, Prisma 6 on Neon (pgvector enabled), env setup script, Dockerfile and docker-compose.yml (written, not run: Docker not installed) | Done | n/a |
| 2026-11-08 | Safety critical core libraries: risk engine (exact fractions, multi gene), escalation rules, consent gate, Ed25519 lab signatures, AES-256-GCM field encryption, hash chained audit, Teach Back logic | Done | 87 unit tests passing |
| 2026-11-08 | DESIGN.md adopted: Night/Pearl tokens, Sora + Readex Pro, type and spacing scales, aurora + grain, glass card, buttons, safety pills, inputs, choices, switch, steps, sheet, empty/error/skeleton states, monogram avatar, count up, risk grids, lazy Living Helix (R3F + bloom, static fallback). `/design-system` page reviewed at 375px and desktop, ar/en, Night/Pearl. i18n with RTL (next-intl) | Done | 90 unit tests (adds ar/en key parity) |
| 2026-11-08 | Server services: env validation, demo session (iron-session), hash chained audit writer with advisory lock, signed result import from encrypted lab inbox, consent gated result and couple views (shared genes only), escalation refresh. `pnpm seed` loads 10 synthetic personas on Neon | Done | n/a (pure logic covered) |
| 2026-11-08 | Bilingual content library: 6 condition cards (3 reading levels), explainer, Teach Back, 7 options (seeded shuffle), escalation and consent wording | Done | 101 unit tests (content completeness, labels, unbiased shuffle) |
| 2026-11-08 | Phase 1 screens: landing, persona login, onboarding wizard (language, reading level, media, pregnancy, granular consent), signed result import with tamper demo, Risk Explainer, couple view (shared genes only, per gene and combined), Learn (6 condition cards, 3 reading levels), Teach Back, Options Explorer, Care and booking with escalation reasons, Journey tracker, Screening finder, Privacy (consents, access history, integrity check, export, delete), counsellor queue, admin integrity view, Judge Tour with demo reset | Done | 101 unit + 3 Playwright e2e (375px, en and ar) |
| 2026-11-08 | Review fixes: CSS based entrance animation (content visible before JavaScript), counsellor queue shows reasons when consented without a result, both partners' escalations refresh together, UAE time zone, non wrapping buttons, production build on Windows | Done | 101 unit + 3 e2e passing |
| 2026-11-08 | Phase 1 documentation: README, ARCHITECTURE, SECURITY, CLINICAL_SAFETY, PRIVACY_AND_DATA_GOVERNANCE, REGULATORY, ASSUMPTIONS, DEPENDENCIES, LIMITATIONS, CHALLENGE_MAPPING, METRICS; stubs for RESPONSIBLE_AI, AI_EVALUATION, PILOT_PLAN, COMMERCIAL; data/reference/SOURCES.md | Done | n/a |

**Phase 1 status:** complete. Next: Phase 2 (Blind Couple Match with Dual Key; Genetic Copilot text with Safety Verifier and evaluation harness).
| 2026-11-10 | Local development switched to Docker Compose: postgres (pgvector), migrate (migrations + seed if empty), web (standalone image). Neon kept as the Node.js fallback. Docker helper scripts, CLAUDE.md and README updated | Done | 101 unit + 3 e2e passing against the Docker stack |
| 2026-11-10 | Testing feedback: fixed "My result" not opening after import (import screen moved from /result/import to /import), renamed to Merros, back link on condition cards, Teach Back confirmation shown in place with a Next button | Done | 101 unit + 5 e2e (new: result navigation, back link, confirmation in viewport) |
| 2026-11-11 | Visual upgrade from reference images (kept DESIGN.md burgundy and gold): starfield, glowing event horizon, gradient display type, eyebrow pills, floating status chips with corner dots, live badges, stat rows, dot meter. New landing (couple match window, journey graph, Inheritance Explorer using the tested engine) and home (real status chips and numbers). Page headers, login and /design-system updated | Done | 101 unit + 5 e2e passing (Docker) |
| 2026-11-11 | Restyled My result (hero with gene copy illustration, stats, gene orbs), Couple (Dual Key orbs with shared genes in gold, stats, dot meters) and Care (counsellor ring, numbered reasons, two step booking, ticket style appointment) | Done | 101 unit + 5 e2e passing (Docker) |

## Phase 2

| Date | Feature | Status | Tests |
|---|---|---|---|
| 2026-11-12 | Blind Couple Match: ECDH PSI over ristretto255 on the partners' devices, fixed size padding, Dual Key release, lab signed input integrity (device and server), reveal on tap, outcome shared with the counsellor only by choice. The server no longer compares results. PSI threat model in SECURITY.md | Done | 121 unit (20 new PSI) + 5 e2e (two phone flow) on Docker |
| 2026-11-12 | Genetic Copilot (text): six agent pipeline (Orchestrator, Variant Interpreter with tools, Explainer, Dialect Adapter, Safety Verifier, Escalation Agent), provider abstraction (offline default, Claude optional), versioned prompts, chat screen with labels, sources and an agent trace, guard log. Evaluation harness with a 54 question bilingual golden set, `pnpm eval`, CI workflow | Done | 168 unit (47 new Copilot and evaluation) + 6 e2e on Docker; evaluation 54/54 with the offline provider |

## Phase 3

| Date | Feature | Status | Tests |
|---|---|---|---|
| 2026-11-12 | Living Results: reclassification detection (mock feed and live ClinVar), amended signed report held until the counsellor releases it, right not to know, impact counts, "Simulate ClinVar update" | Done | 17 unit + e2e |
| 2026-11-12 | Family Risk Engine: Mendelian probabilities by relationship, population adjustment, side inference, ranking, family map, private invitations | Done | 23 unit + e2e |
| 2026-11-12 | Find Care: 14 fictional providers in 8 clinics, filters, Leaflet map, distance, family doctor link with consented referral, booking with any provider | Done | 9 unit + e2e |
| 2026-11-12 | Counselling Hub and Counsellor Copilot: pre session questions, case brief (result, couple outcome if shared, Teach Back, questions, family map), notes, drafted summary, counsellor signature, Clinical Advice label, simulated video room | Done | e2e |
| 2026-11-12 | Phone layout fix: decorative glows no longer widen the page (the last persona card could not be reached on a 375px screen). Browser tests retry a click made in the first instant after a page loads | Done | 217 unit + 10 e2e passing (Docker), typecheck and lint clean |

**Phase 3 status:** complete. Phase 3 migrations are applied to both the Docker database and the Neon fallback. Next: Phase 4 (Population Signals Dashboard with differential privacy, voice, first Azure deployment).
| 2026-11-12 | Phone testing on the same Wi-Fi: the Docker stack accepts sign in over plain http from the computer's network address (COOKIE_SECURE=false in compose only; deployed environments keep HTTPS only cookies). README explains how to open the app and family links on a phone | Done | 217 unit + 10 e2e passing (Docker) |

## Phase 4

| Date | Feature | Status | Tests |
|---|---|---|---|
| 2026-11-12 | Population Signals Dashboard: anonymous aggregate store (consent gated live events and 2,000 synthetic journeys), discrete Laplace mechanism, per journey contribution bounds, privacy budget ledger (ε 2.0 per release, ε 6 per quarter, refusal when spent), suppression under 10, unreliable percentages withheld, demand forecast with regional split and staffing hint, region map, funnel, waiting time, comprehension gaps, before and after counselling, Safety Verifier and cascade signals | Done | 30 unit + 2 e2e |
| 2026-11-12 | Copilot voice: ask by voice and listen to answers. Azure AI Speech through the server (ar-AE, en-US) when a key is set, browser speech otherwise. Spoken answers start with their boundary label | Done locally with browser speech. Azure path unit tested with a mocked service, not yet run against Azure | 14 unit + 1 e2e |
| 2026-11-12 | Azure deployment: `infra/main.bicep` (registry, Container Apps web, migrate job, nightly VariantWatch job, PostgreSQL with pgvector, Key Vault, AI Speech, Blob, monitoring), manual deploy workflow, docs/DEPLOYMENT.md | Written and compiled. **Not deployed**: needs an Azure subscription and a GitHub repository | `az bicep build` passes |
| 2026-11-13 | Testing feedback: a spoken question was sent once for every partial phrase the browser reported. It is now assembled and sent once when the person stops speaking, and shown in the box while they talk | Done | 264 unit + 13 e2e passing (Docker) |
