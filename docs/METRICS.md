# Metrics

What Phase 1 already records, for the Population Signals Dashboard (Phase 4, with differential privacy):

| Metric | Source |
|---|---|
| Comprehension before and after re explanation, by language and reading level | TeachBackAttempt (first try vs final) |
| Time per pathway step and drop off | PathwayEvent timestamps (result received, understood, counselling booked, completed) |
| Escalation reasons and volumes | Escalation (code, severity) |
| Consent choices | Consent (purpose, granted, revoked) |
| Signature refusals | AccessLog `result_import_rejected` |

Never measured: marriage outcomes or any single personal decision.
