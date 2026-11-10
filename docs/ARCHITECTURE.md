# Architecture

## Today (Phase 1)

```mermaid
flowchart LR
  subgraph Browser
    UI[Next.js App Router UI<br/>Arabic RTL + English]
  end
  subgraph Server["Next.js server (Node)"]
    SA[Server actions + route handlers]
    RE[Risk engine<br/>pure, tested]
    ES[Escalation rules<br/>pure, tested]
    CG[Consent gate]
    CR[Field encryption<br/>AES-256-GCM envelope]
    SIG[Ed25519 lab signature verify]
    AU[Hash chained audit log]
  end
  LAB[(Simulated screening lab<br/>signed FHIR bundles)]
  DB[(PostgreSQL + pgvector<br/>Neon now, Azure later)]
  UI --> SA
  SA --> CG --> SIG --> CR --> DB
  SA --> RE
  SA --> ES
  SA --> AU --> DB
  LAB -- encrypted inbox --> DB
```

* **Web app:** Next.js 15 (App Router), TypeScript strict, Tailwind v4 with the DESIGN.md token system, Motion, React Three Fiber (Living Helix, lazy loaded with a static fallback), next-intl (Arabic default, RTL).
* **Data:** Prisma 6 on PostgreSQL. Locally PostgreSQL 16 with pgvector in Docker Compose (Neon as a fallback); production Azure Database for PostgreSQL Flexible Server in UAE North. `pgvector` is enabled for Phase 2 retrieval.
* **Auth:** demo persona picker behind `DEMO_MODE` with an encrypted, httpOnly iron-session cookie. Production integration point: UAE Pass (OpenID Connect).
* **Result import:** the lab's signed FHIR style bundle waits in an encrypted inbox. On import the server verifies the Ed25519 signature against the lab public key **before** storing anything, then stores the canonical bundle encrypted with the person's data key. The signature is re verified each time the result is decrypted.
* **Couple analysis (Phase 1):** after both partners consent, the server computes the couple result and returns **only genes both partners carry**. Phase 2 replaces this with Blind Couple Match (ECDH PSI over ristretto255) so the server never sees either result.

## Target (later phases)

```mermaid
flowchart TB
  subgraph Azure["Azure, UAE North"]
    ACA[Container Apps: web]
    GEN[Container Apps: genomics service<br/>Phase 5]
    JOBS[Container Apps jobs<br/>VariantWatch, video render]
    PG[(PostgreSQL Flexible Server + pgvector)]
    KV[Key Vault: master key, lab keys, AI keys]
    BLOB[(Blob Storage: encrypted videos)]
    SPEECH[AI Speech ar-AE / en-US]
    ACS[Communication Services: video consults]
    MON[Monitor + Application Insights]
  end
  ACA --> PG
  ACA --> KV
  ACA --> SPEECH
  ACA --> ACS
  JOBS --> PG
  GEN --> PG
  ACA --> MON
```

Infrastructure as code (Bicep) and a GitHub Actions deploy workflow arrive with the first Azure deployment (Phase 4).

## Code map

| Path | Purpose |
|---|---|
| `lib/risk/` | Deterministic risk engine, exact fractions, gene catalogue |
| `lib/escalation/rules.ts` | Escalation Engine rules (SPEC 4.8) |
| `lib/consent/` | Consent purposes and the single consent gate |
| `lib/fhir/` | FHIR style bundle builder/parser, Ed25519 signing |
| `lib/crypto/` | AES-256-GCM field encryption and key wrapping |
| `lib/audit/` | Hash chain (pure) and the database writer |
| `lib/services/` | Result import, consent gated reads, escalation refresh, pathway |
| `lib/actions/` | Server actions (all inputs validated with zod) |
| `content/` | Bilingual content library with safety labels and sources |
| `components/ui/` | The design system (see `/design-system`) |
| `app/[locale]/` | Screens |
