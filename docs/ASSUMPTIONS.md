# Assumptions

* Results arrive from licensed screening labs as HL7 FHIR Genomics style bundles, signed by the lab. Meros can obtain each lab's public key through a trusted channel (for example a national key registry).
* The carrier panel is about 570 genes in production; the prototype panel lists seven genes (HBB, HBA1, HBA2, SMN1, GJB2, CFTR, G6PD).
* Pathogenic and likely pathogenic variants are treated as equivalent for couple risk, following common clinical practice.
* Each pregnancy is independent; risk is reported per pregnancy.
* The NCCN Distress Thermometer cut off of 4 is used for escalation (Distress Check is Phase 5).
* Genetic counsellors are available in person, by video and by phone in Abu Dhabi, Al Ain and Al Dhafra.
* People may choose not to know their result; nothing is shown and nothing is shared without explicit, granular, time limited consent.
* Arabic is the default language; Modern Standard Arabic is used for text in Phase 1, with Gulf dialect adaptation in the copilot and voice phases.
* Consent defaults: couple comparison and counsellor access 90 days; anonymous analytics and reclassification recontact one year; viewing one's own result until withdrawn.
