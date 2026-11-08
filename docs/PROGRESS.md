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
