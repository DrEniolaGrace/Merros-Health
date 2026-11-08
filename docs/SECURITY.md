# Security

## Lab signed results (input integrity)

* Each screening result is a FHIR style bundle signed by the issuing lab with **Ed25519** (`@noble/curves`). The signature covers the canonical JSON (keys sorted recursively), so formatting changes do not matter but any content change does.
* Meros holds only the lab **public** key (`LAB_SIGNING_PUBLIC_KEY`). In this prototype the private key also sits in `.env` so `pnpm seed` can play the lab; in production the lab keeps it.
* Import verifies the signature before anything is stored; a failed check is refused and logged (`result_import_rejected`). Stored results are re verified on every decryption.
* **Why it matters for Blind Couple Match (Phase 2):** the panel has only about 570 genes, so a dishonest partner could feed every gene into PSI to learn the other's full list. PSI inputs will be accepted only if they match a lab signed result, verified on both client and server. The same `verifyBundle` function is reused. Tests: tampered classification, inflated gene list, wrong key, flipped signature byte, malformed input.

## Encryption at rest

* Envelope encryption: each user has a random 256 bit data key, stored only wrapped (AES-256-GCM) by the master key (`ENCRYPTION_MASTER_KEY` locally, Azure Key Vault in production).
* The stored result bundle is encrypted with the user's data key, with the user id as additional authenticated data (a ciphertext cannot be moved to another account).
* The lab inbox payload is encrypted with the master key.
* Tests: round trip, unique IV, tamper detection, wrong key, wrong AAD, key wrapping.

## Tamper evident audit log

* Every access and important action is appended to `AccessLog`: `hash = SHA-256(prevHash || canonical(entry))`, starting from a genesis hash.
* Appends run in a transaction holding a Postgres advisory lock so concurrent writers cannot fork the chain.
* Any edit, deletion or insertion breaks verification (tested). The Privacy and Admin screens include a **Verify integrity** button.
* Limitation: deleting the newest entries (truncation) is detectable only by anchoring the head hash externally, for example periodically writing it to Azure immutable blob storage. Planned with the Azure deployment.
* Account deletion keeps audit rows, which reference only random identifiers, so the chain stays verifiable. Demo reset intentionally restarts the chain at genesis.

## Sessions and access

* Demo login is gated by `DEMO_MODE=true`; production uses UAE Pass.
* Session cookie: iron-session (encrypted and signed), httpOnly, SameSite=Lax, Secure in production, 8 hour TTL.
* Role checks on every protected page and server action (`requireUser([...])`). Counsellors see result details only with the person's active `counsellor_access` consent.
* All server action inputs are validated with zod. Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`.

## Secrets

`.env` and `.env.*` are git ignored (only `.env.example` is committed). `pnpm setup:env` generates local secrets. Production secrets live in Azure Key Vault.

## Dependencies

`pnpm audit --prod` is clean. Patched Next.js 15.5.29 (fixes CVE-2025-66478) and pinned overrides for postcss, sharp, effect and deepmerge-ts.
