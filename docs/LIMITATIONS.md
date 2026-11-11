# Limitations

* **Synthetic data only.** All people, clinicians, clinics, appointments and lab results are fictional. Variants are real ClinVar records assigned to fictional people.
* **Content pending accredited review.** Condition cards, explanations, Teach Back items, options and consent wording were written for the prototype and must be reviewed by accredited clinicians, genetic counsellors and Arabic language reviewers before any real use.
* **Simulated integrations.** Lab delivery (signed bundle in an encrypted inbox), appointment booking, the counsellor directory and authentication (persona picker instead of UAE Pass) are simulated.
* **Blind Couple Match scope.** Matching runs on the partners' devices and the server only relays blinded points, but the prototype server still stores each person's encrypted result at rest. A modified client could submit up to 8 chosen genes (see the PSI threat model in SECURITY.md). Cardinality only mode and synchronised reveal are not built. Shared genes are matched by gene, so the couple view names every condition linked to that gene.
* **Risk engine scope.** Autosomal recessive couple risk only. X linked, dominant, phase unknown and homozygous findings are routed to a counsellor rather than computed. Residual risk after a negative result is explained in words, not computed. Alpha thalassaemia arrangements require a counsellor.
* **Data residency.** Local development uses Postgres in Docker; the Neon fallback database is in AWS eu-central-1 (synthetic data only). Production targets Azure UAE North.
* **Audit truncation.** Deleting the newest audit entries is not detectable until the head hash is anchored externally (planned with Azure immutable storage). Demo reset deliberately restarts the chain.
* **Docker on Windows only so far.** The compose stack runs locally (Docker Desktop); the image has not yet been deployed to Azure Container Apps.
* **Audio preference.** Choosing "listen" is stored; Gulf Arabic voice arrives in Phase 4.
* **Accessibility.** Built to WCAG AA contrast and keyboard use; a full Lighthouse and screen reader audit is pending.
* **Kinship estimates (Phase 5)** will be approximations and counsellor only.
