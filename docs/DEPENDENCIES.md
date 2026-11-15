# Dependencies

Pinned in `package.json` and `pnpm-lock.yaml`. `pnpm audit --prod` reports no known vulnerabilities (2026-11-08).

| Area | Package | Version | Why |
|---|---|---|---|
| Framework | next | 15.5.29 | App Router; patched for CVE-2025-66478 |
| UI | react, react-dom | 19.1.5 | |
| i18n | next-intl | 4.14.9 | Arabic (RTL) and English routing and messages |
| Styling | tailwindcss | 4.x | Token based styling (DESIGN.md) |
| Motion | motion | 12.43.0 | Calm UI motion (respects reduced motion) |
| 3D | three, @react-three/fiber, @react-three/drei, @react-three/postprocessing | 0.187.0, 9.8.2, 10.7.9, 3.2.2 | Living Helix with bloom, lazy loaded |
| Icons | @phosphor-icons/react | 2.1.10 | One weight (light) across the app |
| Data | prisma, @prisma/client | 6.19.3 | PostgreSQL ORM and migrations |
| Crypto | @noble/curves, @noble/hashes | 1.9.7, 1.8.0 | Ed25519 lab signatures; ristretto255 for Blind Couple Match (PSI) |
| AI | @anthropic-ai/sdk | 1.8.0 | Claude provider for the Genetic Copilot (optional; offline provider is the default) |
| Map | leaflet | 1.9.4 | Find Care map with OpenStreetMap tiles |
| Sessions | iron-session | 8.0.4 | Encrypted demo session cookie |
| Validation | zod | 4.6.7 | Env and server action input validation |
| Tests | vitest, @playwright/test | 3.2.4, 1.65.0 | Unit and end to end |
| Tooling | tsx, dotenv, prettier, eslint | | Scripts and code quality |

Security overrides (`pnpm.overrides`): postcss ^8.5.23, sharp ^0.35.5, effect ^3.20.0, deepmerge-ts ^8.0.0.

## Video

`remotion` and `@remotion/player` 4.0.543 (My Result Video, played in the browser). Remotion is source available, not MIT: it is free for individuals and for organisations of up to three people, and larger organisations need a company licence (remotion.dev/license). Check this before any commercial or institutional use.

## External services

| Service | Phase | Notes |
|---|---|---|
| Neon Postgres (eu-central-1) | 1 | Development database, synthetic data only |
| NCBI E-utilities (ClinVar) | 1 (manual), 3 (`pnpm variant-watch`) | Variant IDs verified 2026-11-08; optional `NCBI_API_KEY` |
| OpenStreetMap tiles | 3 | Find Care map background |
| Azure AI Speech (REST: speech to text `ar-AE` / `en-US`, neural text to speech) | 4 | Copilot voice. Optional: falls back to the browser's Web Speech API without `AZURE_SPEECH_KEY`. No SDK dependency |
| Azure (UAE North): Container Registry, Container Apps and jobs, PostgreSQL Flexible Server, Key Vault, Blob, Monitor | 4 | Defined in `infra/main.bicep`; not yet deployed |
| Azure Communication Services | 5 | Video consults; not provisioned |
| Claude via the Anthropic API (optional, `AI_PROVIDER=anthropic`) | 2 | Genetic Copilot. Microsoft Foundry route planned with the Azure deployment |

## Genomics service (Phase 5)

Python FastAPI with bcftools, PLINK and KING, in its own container. Versions will be pinned here when built.
