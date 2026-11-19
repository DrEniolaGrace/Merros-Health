# Merros

A privacy preserving genomic companion that helps couples build healthy families with a plan. It helps individuals, couples, families and the health system identify, understand and act on inherited disease risk: a shared carrier result becomes a clear plan of counselling, options and next steps, and every choice stays with the couple. Built for the Future Health Digital Innovation Challenge 2026 (Abu Dhabi), Fertility Challenge 03.

> Merros never tells anyone whom to marry or what to decide. Success means understanding, timely access to qualified counselling, and confident personal choice.

**Reference standard.** Merros follows the Department of Health Abu Dhabi *Premarital Screening Standard* (DoH/STD/PSS/V3, version 3, September 2024): https://www.doh.gov.ae/-/media/Feature/Resources/Standards/Premarital-Screening-standard-for-publication.ashx. Its gene panel is the standard's Appendix 12: 563 autosomal recessive genes (570 entries as printed), updated to current HGNC names. The panel covers autosomal recessive genes only and not every recessive condition. The care pathway follows the standard's counselling process. See [About and sources](app/[locale]/sources/page.tsx) in the app and `data/reference/SOURCES.md`.

**Merros is an independent prototype. It is not affiliated with or endorsed by the Department of Health Abu Dhabi; it uses the Department's published standard as a public reference only.**

**All data in this prototype is synthetic.** Every person, clinician and clinic is fictional.

## Run it in under 5 minutes (Docker, recommended)

Prerequisites: Docker Desktop, and Node.js 22 or newer (only to generate local secrets once).

```bash
npm install -g pnpm@9.15.0
pnpm install
pnpm setup:env
docker compose up --build -d
```

`pnpm setup:env` creates `.env` (never committed) with the encryption master key, session secret and the simulated lab's Ed25519 key pair. Compose then starts PostgreSQL with pgvector, applies migrations, seeds the synthetic personas (only if the database is empty) and serves the app at http://localhost:3000.

**Live demonstration:** the app is deployed on Vercel from the `master` branch, with a Neon `production` database (see docs/DEPLOYMENT.md). Azure UAE North remains the production target. Two Neon branches keep things safe: `dev` for development and all tests, `production` for the live site only; tests and seeds refuse to run against production.

**On a phone:** `localhost` only works on the computer itself. Connect the phone to the same Wi-Fi and open `http://<computer's Wi-Fi address>:3000` (find the address with `ipconfig`, "IPv4 Address" under Wi-Fi). Family invitation links carry whatever address the app was opened with, so create them from that address too.

| Task | Command |
|---|---|
| Start, or rebuild after code changes | `pnpm docker:up` |
| Reset demo data | `pnpm docker:seed` (or Judge Tour > Reset demo data) |
| App logs | `pnpm docker:logs` |
| Stop | `pnpm docker:down` (data stays in the `pgdata` volume; add `-v` to wipe it) |

The genomics service is commented out in `docker-compose.yml` until Phase 5.

### Fallback: Node.js with Neon (no Docker)

Set `DATABASE_URL` (pooled Neon URL, host contains `-pooler`) and `DIRECT_URL` (same URL without `-pooler`) in `.env`. Compose overrides these two variables, so they can stay in `.env` permanently.

```bash
pnpm db:deploy
pnpm seed
pnpm build
pnpm start
```

Use `pnpm dev` for hot reload (first page loads compile slowly on Windows). Stop the Docker web container first, since both use port 3000.

## Demo logins

Pick a persona on the sign in screen (no passwords; demo mode only).

| Persona | Story |
|---|---|
| Mariam | Engaged to her first cousin Khalid; her signed result is waiting. Start here. |
| Khalid | Has seen his result and agreed to compare. Shares HBB and GJB2 with Mariam (25% each, 43.75% combined). |
| Noura | SMA carrier; fiancé Faisal is not a carrier on the panel. |
| Hamad | Variant of uncertain significance in HBB, routed to a counsellor. |
| Aisha | Arabic, simple reading level, prefers listening. Sickle cell trait. |
| Sara | Married, planning pregnancy, never screened. Preconception Screening Finder. |
| Dr. Layla Haddad | Fictional genetic counsellor: consent aware case queue. |
| Any patient persona | Phase 5 screens: My video, Values, Check in, and Risk Beyond the Panel on the Couple page. |
| Programme Admin | Population Signals Dashboard (differential privacy, privacy budget, demand forecast) and the audit integrity check. |

## Judge Tour

The gold **Judge Tour** button (bottom corner of every screen) walks through Phase 1 in eight steps, switching personas automatically, and lists later phase features as "Coming in Phase N". **Reset demo data** restores the starting state.

## Demo video and screenshots

One command records the competition demo from scratch:

```
pnpm demo
```

It resets the demo data on the Neon `dev` branch (never production), builds the app, starts it on port 3100, records the story of one couple, Mariam and Khalid, with Playwright, takes 64 screenshots, and assembles `docs/demo.mp4` (under 3 minutes, 1920x1080, English) with Remotion. The video opens with the problem, follows four scenes (Mariam understands her result; Blind Couple Match with a plan; Dr. Layla prepares with the Counsellor Copilot; Living Results a year later), shows a montage of about 28 seconds (Copilot in Arabic, Family Risk Engine, Risk Beyond the Panel, Population Signals) and closes with the user testing result. The whole app is always shown, and a small caption bar sits under it, never on it. It takes about 30 minutes; the Copilot uses Claude when `AI_API_KEY` is set in `.env`.

* Captions and title cards: `demo/captions.json` (one line per shot, at most 12 words; a unit test checks it). After editing, run `pnpm demo --render-only` (a few minutes; no re-recording).
* User testing results: `docs/USER_TESTING.md`.
* Screenshots: `docs/screenshots/`, named `<language>-<desktop|mobile>-<number>-<screen>.png`.
* Options: `--skip-build`, `--scenes-only`, `--screens-only`, `--render-only`, `--offline-ai`.
* `docs/demo.mp4` is not committed (it is large and changes with every run); upload it to the submission directly.

## Genetic Copilot

The Copilot works offline by default with a demo model that composes approved content. To use Claude, set `AI_PROVIDER=anthropic` and `AI_API_KEY` in `.env`, then run `pnpm docker:up`. See `docs/RESPONSIBLE_AI.md`.

## Tests

```bash
pnpm test        # 217 unit tests: risk engine, escalation, consent, signatures, encryption, audit chain, PSI, Safety Verifier, Copilot, Living Results, Family Risk Engine, Find Care, content, i18n
pnpm eval        # Copilot evaluation on the golden set, writes docs/AI_EVALUATION.md
pnpm variant-watch  # Living Results: check stored variants against live ClinVar
pnpm test:e2e    # Playwright smoke tests at 375px in English and Arabic (resets demo data first)
```

`pnpm test:e2e` resets whichever database `DATABASE_URL` points to (Neon by default, from `.env`). To test the Docker stack, point it at the container database for that command (PowerShell):

```powershell
$env:DATABASE_URL="postgresql://meros:meros@localhost:5432/meros"; $env:DIRECT_URL=$env:DATABASE_URL; pnpm test:e2e
```

## Documentation

See [`docs/`](docs): architecture, security, privacy, clinical safety, regulatory alignment, assumptions, dependencies, limitations, challenge mapping and progress.

## License

Copyright 2026 Eniola Grace Rosilu. All rights reserved. Shared for evaluation in the Future Health Digital Innovation Challenge; see [LICENSE](LICENSE).
