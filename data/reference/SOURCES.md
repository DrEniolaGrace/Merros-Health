# Reference data sources

## ClinVar variation IDs used by synthetic personas

Verified via NCBI E-utilities (esummary, db=clinvar) on 2026-11-08. Assigning these real variants to fictional people is synthetic.

| Variant | ClinVar ID | Classification (review status) | Used by |
|---|---|---|---|
| NM_000518.5(HBB):c.92+5G>C | 15447 | Pathogenic (reviewed by expert panel) | Mariam |
| NM_000518.5(HBB):c.118C>T (p.Gln40Ter) | 15402 | Pathogenic (multiple submitters, no conflicts) | Khalid |
| NM_004004.6(GJB2):c.35del (p.Gly12fs) | 17004 | Pathogenic (reviewed by expert panel) | Mariam, Khalid |
| NM_000518.5(HBB):c.20A>T (p.Glu7Val), HbS | 15333 | Pathogenic (multiple submitters, no conflicts) | Aisha |
| NM_000518.4(HBB):c.371C>A (p.Thr124Asn) | 15584 | Uncertain significance (multiple submitters, no conflicts) | Hamad (reclassification in Phase 3 is simulated) |
| SMN1 exon 7 copy number = 1 | none (copy number result) | Carrier | Noura |

## Condition content

Original plain language summaries citing:

* MedlinePlus Genetics, https://medlineplus.gov/genetics/ (beta thalassemia, sickle cell disease, spinal muscular atrophy, nonsyndromic hearing loss, cystic fibrosis, alpha thalassemia)
* GeneReviews (NCBI Bookshelf): NBK1426, NBK1377, NBK1352, NBK1272, NBK1250, NBK1435

No text was copied.

## beyond-panel.json (Risk Beyond the Panel)

Synthetic. Generated on 2026-11-15 by `scripts/gen-beyond-panel.cjs` with a fixed seed. Not the output of a genomics pipeline: no genomes were simulated and no ROH or kinship tool was run. Segments are placed at random on the GRCh38 autosomes so that the total shared length is plausible for each demo couple's stated relationship (first cousins: about a quarter of the autosomes on one copy; unrelated: almost none).

Reference for the risk range: Bennett RL, Motulsky AG, Bittles A, et al. Genetic counseling and screening of consanguineous couples and their offspring: recommendations of the National Society of Genetic Counselors. J Genet Couns. 2002;11(2):97-119.

## doh-pms-panel.json (Abu Dhabi premarital genetic panel)

Source: Department of Health, Abu Dhabi. *Premarital Screening Standard*. Document reference DoH/STD/PSS/V3, version 3, published September 2024 (revision due September 2027). https://www.doh.gov.ae/-/media/Feature/Resources/Standards/Premarital-Screening-standard-for-publication.ashx, Appendix 12 "List of tested genes (doesn't include X or Y linked or AD genes and not all AR diseases)", pages 46 and 47. The PDF is kept outside the repository and cited here.

Merros is an independent prototype. It is not affiliated with or endorsed by the Department of Health Abu Dhabi; it uses the Department's published standard as a public reference only.

Method:
* Text extracted on 2026-11-16 with pdfjs-dist 4.10.38, cell by cell using text positions, so that a bracketed older name is attached to the gene printed above it in the same column (`scripts/extract-doh-panel.mjs`).
* Every printed name checked against the HGNC complete set (`hgnc_complete_set.txt`, downloaded 2026-11-16). A name HGNC lists as a previous symbol is replaced by the current approved symbol and kept as an alias.

Result: 570 printed entries, 563 unique current symbols. 7 duplicates merged (ADGRG1, ALDH3A2, G6PC1, HJV, LRPPRC, MMUT, VPS13B). 5 genes renamed by HGNC since publication: GAS8 to DRC4, CCDC65 to DRC2, CCDC103 to DNAAF19, G6PC to G6PC1, MUT to MMUT. Names that could not be mapped: none. 24 genes carry an older name as an alias.

Notes: SMN1 is printed with an asterisk and the standard gives no footnote for it; it is recorded, not interpreted. GIF is printed as an older name of three different genes (CBLIF, MIF, MT3); HGNC lists it for all three, so it is kept on each. G6PD (X linked) is not on the panel; the risk engine still knows it so that an X linked finding is routed to a counsellor.

Other parts of the standard used (not copied): section 3.3 and Appendices 14 and 15 for the care pathway; Appendix 13 for the kinds of genetic counselling service in Find Care and for the pilot plan. No form, declaration or agreement from the appendices is reproduced.
