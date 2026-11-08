# Responsible AI

Phase 1 contains **no AI model**. Foundations already in place for Phase 2:

* Risk numbers come only from the deterministic, tested risk engine; the copilot will call it as a tool.
* Safety boundary labels: content types forbid Clinical Advice from any non human source, enforced by tests.
* Non directive content with a test that blocks "recommended" style wording in options.
* Escalation hook `safety_verifier_block` ready for the two stage Safety Verifier.
* Content items carry ids, versions and sources so copilot answers can cite them.

To be completed in Phase 2: provider abstraction (`lib/ai/provider.ts`), versioned prompts, Safety Verifier (rules plus classifier), de identification, and the evaluation harness.
