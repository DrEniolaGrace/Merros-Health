# Metrics

The Population Signals Dashboard (Phase 4) publishes these with differential privacy from the anonymous aggregate store: funnel by region, time to counselling by region, weekly bookings with an 8 week forecast, first try comprehension by language and reading level, SURE and distress before and after counselling (synthetic until Phase 5), Safety Verifier block rate, cascade yield and Living Results impact.

What the app records per person (the sources those anonymous events come from):

| Metric | Source |
|---|---|
| Comprehension before and after re explanation, by language and reading level | TeachBackAttempt (first try vs final) |
| Time per pathway step and drop off | PathwayEvent timestamps (result received, understood, counselling booked, completed) |
| Escalation reasons and volumes | Escalation (code, severity) |
| Consent choices | Consent (purpose, granted, revoked) |
| Reclassification impact: people affected per event | ReclassificationEvent.affected |
| Time from reclassification to counsellor contact | CounsellorTask created and released timestamps |
| Cascade screening: relatives added, invitations created and opened | PedigreeNode, RelativeInvite |
| Copilot safety: which guard rule fired, by language | GuardEvent |
| Signature refusals | AccessLog `result_import_rejected` |

Never measured: marriage outcomes or any single personal decision.
