# Limitations

* **Synthetic data only.** All people, clinicians, clinics, appointments and lab results are fictional. Variants are real ClinVar records assigned to fictional people.
* **Content pending accredited review.** Condition cards, explanations, Teach Back items, options and consent wording were written for the prototype and must be reviewed by accredited clinicians, genetic counsellors and Arabic language reviewers before any real use.
* **Simulated integrations.** Lab delivery (signed bundle in an encrypted inbox), appointment booking, the counsellor directory and authentication (persona picker instead of UAE Pass) are simulated.
* **Blind Couple Match scope.** Matching runs on the partners' devices and the server only relays blinded points, but the prototype server still stores each person's encrypted result at rest. A modified client could submit up to 8 chosen genes (see the PSI threat model in SECURITY.md). Cardinality only mode and synchronised reveal are not built. Shared genes are matched by gene, so the couple view names every condition linked to that gene.
* **Risk engine scope.** Autosomal recessive couple risk only. X linked, dominant, phase unknown and homozygous findings are routed to a counsellor rather than computed. Residual risk after a negative result is explained in words, not computed. Alpha thalassaemia arrangements require a counsellor.
* **Data residency.** Local development uses Postgres in Docker; the Neon fallback database is in AWS eu-central-1 (synthetic data only). Production targets Azure UAE North.
* **Audit truncation.** Deleting the newest audit entries is not detectable until the head hash is anchored externally (planned with Azure immutable storage). Demo reset deliberately restarts the chain.
* **Docker on Windows only so far.** The compose stack runs locally (Docker Desktop); the image has not yet been deployed to Azure Container Apps.
* **Genetic Copilot.** Runs on an offline demo model unless a Claude API key is configured; Claude has not yet been evaluated on the golden set. The golden set and Safety Verifier phrase lists are drafts pending review by a genetic counsellor and Gulf Arabic reviewers. Retrieval is lexical, not embedding based. Conversations are not stored, so the Copilot has no memory between visits.
* **Living Results.** The demo reclassification is simulated. The live ClinVar check exists (`pnpm variant-watch`) but is not yet scheduled; that needs the Azure job in Phase 4. The amended signed report is produced by the prototype playing the lab.
* **Family Risk Engine.** Carrier frequencies are illustrative and unverified. Consanguineous pedigrees use a documented approximation. The family map is a 2D drawing, not the 3D scene in DESIGN.md.
* **Find Care.** Every provider, clinic and coordinate is fictional. Map tiles come from OpenStreetMap and need an internet connection. Distance is straight line, measured from a chosen city centre, not from the person's location.
* **Video sessions are simulated.** The room shows both participants but uses no camera or microphone. Real calls need Azure Communication Services (Phase 4).
* **Session summaries.** With the offline model the draft only wraps the counsellor's notes in a standard opening and closing. Values Summary is not built because Values Compass is not built.
* **Audio preference.** Choosing "listen" is stored; Gulf Arabic voice arrives in Phase 4.
* **Accessibility.** Built to WCAG AA contrast and keyboard use; a full Lighthouse and screen reader audit is pending.
* **Kinship estimates (Phase 5)** will be approximations and counsellor only.
