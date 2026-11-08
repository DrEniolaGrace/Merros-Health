# Meros

A privacy preserving genomic companion that helps individuals, couples, families and the health system identify, understand and act on inherited disease risk. Built for the Future Health Digital Innovation Challenge 2026 (Abu Dhabi), Fertility Challenge 03.

> Meros never tells anyone whom to marry or what to decide. Success means understanding, timely access to qualified counselling, and confident personal choice.

**All data in this prototype is synthetic.** Every person, clinician and clinic is fictional.

## Run it in under 5 minutes (Windows, no Docker)

Prerequisites: Node.js 22 or newer, and a Postgres database (we use a hosted [Neon](https://neon.tech) project).

```bash
npm install -g pnpm@9.15.0
pnpm install
pnpm setup:env
```

`pnpm setup:env` creates `.env` and generates the encryption master key, session secret and the simulated lab's Ed25519 key pair. Open `.env` and set `DATABASE_URL` (pooled Neon URL, host contains `-pooler`) and `DIRECT_URL` (same URL without `-pooler`). `.env` is never committed.

```bash
pnpm db:deploy
pnpm seed
pnpm build
pnpm start
```

Open http://localhost:3000. For development with hot reload use `pnpm dev` (first page loads compile slowly on Windows).

### With Docker (later)

`Dockerfile` and `docker-compose.yml` are ready: point `DATABASE_URL` / `DIRECT_URL` at the compose Postgres (already set in the compose file) and run `docker compose up`. The genomics service is commented out until Phase 5.

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
| Programme Admin | Audit integrity check (dashboard arrives in Phase 4). |

## Judge Tour

The gold **Judge Tour** button (bottom corner of every screen) walks through Phase 1 in eight steps, switching personas automatically, and lists later phase features as "Coming in Phase N". **Reset demo data** restores the starting state.

## Tests

```bash
pnpm test        # 101 unit tests: risk engine, escalation, consent, signatures, encryption, audit chain, Teach Back, content, i18n
pnpm test:e2e    # Playwright smoke tests at 375px in English and Arabic (resets demo data first)
```

## Documentation

See [`docs/`](docs): architecture, security, privacy, clinical safety, regulatory alignment, assumptions, dependencies, limitations, challenge mapping and progress.
