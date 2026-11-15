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
