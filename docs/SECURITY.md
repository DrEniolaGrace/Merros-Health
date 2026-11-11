# Security

## Lab signed results (input integrity)

* Each screening result is a FHIR style bundle signed by the issuing lab with **Ed25519** (`@noble/curves`). The signature covers the canonical JSON (keys sorted recursively), so formatting changes do not matter but any content change does.
* Merros holds only the lab **public** key (`LAB_SIGNING_PUBLIC_KEY`). In this prototype the private key also sits in `.env` so `pnpm seed` can play the lab; in production the lab keeps it.
* Import verifies the signature before anything is stored; a failed check is refused and logged (`result_import_rejected`). Stored results are re verified on every decryption.
* **Why it matters for Blind Couple Match (Phase 2):** the panel has only about 570 genes, so a dishonest partner could feed every gene into PSI to learn the other's full list. PSI inputs will be accepted only if they match a lab signed result, verified on both client and server. The same `verifyBundle` function is reused. Tests: tampered classification, inflated gene list, wrong key, flipped signature byte, malformed input.

## Blind Couple Match: PSI threat model (`lib/psi/protocol.ts`)

**Goal.** Partners learn which carrier genes they share and nothing else. Neither partner, nor the relay, learns the other's remaining genes.

**Protocol.** ECDH private set intersection over ristretto255 (`@noble/curves`), run in each partner's browser:

1. Each device verifies its own lab signed result, takes the genes where the person is a straightforward carrier, hashes each to a curve point (RFC 9380 hash to ristretto255, domain separated) and raises it to a fresh secret scalar that never leaves the device. The set is padded with random points to a fixed size of 8 and shuffled (round 1).
2. Each device raises the partner's round 1 points to its own secret, preserving order (round 2).
3. Each device compares the partner's round 2 of its own points with its own exponentiation of the partner's round 1. Equal points are shared genes. The risk engine then runs on the device.

**Dual Key.** The relay releases a partner's points only while both partners hold an active `couple_comparison` consent. Withdrawing consent deletes the relay state. Either partner can decline; the other only ever sees "waiting".

| Threat | Mitigation | Residual risk |
|---|---|---|
| Relay (server) reads the match | It only stores blinded points; computing the intersection needs a device secret. Verified by unit tests and by inspecting the `PsiSession` table (hex points only) | The prototype server also stores each person's encrypted result for the Risk Explainer, so a fully compromised server with the master key could decrypt results at rest. Production: results encrypted to user held keys |
| Partner learns how many genes I carry | Fixed size padding (8 points) | Panels where a person carries more than 8 genes need a larger fixed size |
| Dishonest partner submits every gene on the panel to learn my full list (the panel has about 570 genes) | Inputs must come from a lab signed result: verified on the device before blinding and on the server before round 1 is accepted; the fixed set size caps any submission at 8 items | A modified client could still submit up to 8 chosen genes instead of its own. Production upgrade: the lab signs per gene blinded commitments, or a zero knowledge proof ties round 1 to the signed result |
| Replay or stale secrets | A new round 1 voids all earlier round 2 values; devices detect a mismatch with their stored secret and restart | None known |
| Malformed points (identity, invalid encodings, duplicates) | Rejected on device and relay (`decodePointSet`, tested) | None known |
| Outcome leaks to the server | The server learns shared genes only if the person presses "Tell our counsellor"; the claim must be a subset of their own signed carrier genes | The person chooses this |
| Device theft | The secret lives in browser storage for the session | Production: platform keystore, short lived secrets |

Not built (optional in the specification): cardinality only mode and a synchronised "reveal together" moment. The reveal is a deliberate tap on each phone.

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
