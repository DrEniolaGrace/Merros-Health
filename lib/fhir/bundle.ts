/**
 * Minimal HL7 FHIR Genomics style result (SPEC 4.1): a Bundle with one DiagnosticReport and one
 * Observation per reported variant. LOINC codes follow the FHIR Genomics Reporting IG:
 *   48018-6 gene studied, 48004-6 DNA change (c.HGVS), 53034-5 allelic state,
 *   53037-8 clinical significance, 81259-4 associated phenotype.
 * This is "FHIR style" for the prototype, not a validated IG profile.
 */
import { z } from "zod";
import type { AcmgClass, Variant, Zygosity } from "@/lib/risk/types";

const LOINC = "http://loinc.org";
const CLINVAR = "http://www.ncbi.nlm.nih.gov/clinvar";
const MEROS_CONDITION = "https://meros.example/fhir/condition";

const ACMG_TO_LOINC: Record<AcmgClass, { code: string; display: string }> = {
  pathogenic: { code: "LA6668-3", display: "Pathogenic" },
  likely_pathogenic: { code: "LA26332-9", display: "Likely pathogenic" },
  vus: { code: "LA26333-7", display: "Uncertain significance" },
  likely_benign: { code: "LA26334-5", display: "Likely benign" },
  benign: { code: "LA6675-8", display: "Benign" },
};

const ZYG_TO_LOINC: Record<Zygosity, { code: string; display: string }> = {
  heterozygous: { code: "LA6706-1", display: "Heterozygous" },
  homozygous: { code: "LA6705-3", display: "Homozygous" },
  hemizygous: { code: "LA6707-9", display: "Hemizygous" },
};

export interface ResultMeta {
  accession: string;
  labName: string;
  issued: string; // ISO date
  panelGenes: string[];
}

export function buildBundle(meta: ResultMeta, variants: Variant[]) {
  const observations = variants.map((v, i) => ({
    resourceType: "Observation",
    id: `obs-${i + 1}`,
    status: "final",
    code: { coding: [{ system: LOINC, code: "69548-6", display: "Genetic variant assessment" }] },
    component: [
      { code: { coding: [{ system: LOINC, code: "48018-6" }] }, valueCodeableConcept: { coding: [{ system: "http://www.genenames.org", code: v.gene }] } },
      { code: { coding: [{ system: LOINC, code: "48004-6" }] }, valueCodeableConcept: { text: v.hgvs } },
      { code: { coding: [{ system: LOINC, code: "53034-5" }] }, valueCodeableConcept: { coding: [{ system: LOINC, ...ZYG_TO_LOINC[v.zygosity] }] } },
      { code: { coding: [{ system: LOINC, code: "53037-8" }] }, valueCodeableConcept: { coding: [{ system: LOINC, ...ACMG_TO_LOINC[v.acmg] }] } },
      { code: { coding: [{ system: LOINC, code: "81259-4" }] }, valueCodeableConcept: { coding: [{ system: MEROS_CONDITION, code: v.conditionId }] } },
      ...(v.clinvarId
        ? [{ code: { coding: [{ system: LOINC, code: "81252-9", display: "Discrete genetic variant" }] }, valueCodeableConcept: { coding: [{ system: CLINVAR, code: v.clinvarId }] } }]
        : []),
    ],
  }));
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: meta.issued,
    entry: [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "report",
          status: "final",
          identifier: [{ system: "https://lab.example/accession", value: meta.accession }],
          code: { coding: [{ system: LOINC, code: "51969-4", display: "Genetic analysis report" }] },
          issued: meta.issued,
          performer: [{ display: meta.labName }],
          result: observations.map((o) => ({ reference: `Observation/${o.id}` })),
          extension: [{ url: "https://meros.example/fhir/panel-genes", valueString: meta.panelGenes.join(",") }],
          conclusion: variants.length ? "Variants reported" : "No reportable variants on the tested panel",
        },
      },
      ...observations.map((o) => ({ resource: o })),
    ],
  };
}

export type FhirBundle = ReturnType<typeof buildBundle>;

const codingSchema = z.object({ system: z.string().optional(), code: z.string().optional(), display: z.string().optional() });
const componentSchema = z.object({
  code: z.object({ coding: z.array(codingSchema) }),
  valueCodeableConcept: z.object({ coding: z.array(codingSchema).optional(), text: z.string().optional() }),
});
const bundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  entry: z.array(z.object({ resource: z.record(z.string(), z.unknown()) })),
});

function invert<T extends string>(m: Record<T, { code: string }>): Record<string, T> {
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [(v as { code: string }).code, k])) as Record<string, T>;
}
const LOINC_TO_ACMG = invert(ACMG_TO_LOINC);
const LOINC_TO_ZYG = invert(ZYG_TO_LOINC);

export interface ParsedResult {
  accession: string;
  issued: string;
  labName: string;
  panelGenes: string[];
  variants: Variant[];
}

/** Parses and validates a bundle. Throws on any malformed or unknown coded value. */
export function parseBundle(input: unknown): ParsedResult {
  const bundle = bundleSchema.parse(input);
  const report = bundle.entry.map((e) => e.resource).find((r) => r.resourceType === "DiagnosticReport") as
    | Record<string, unknown>
    | undefined;
  if (!report) throw new Error("No DiagnosticReport in bundle");
  const identifier = (report.identifier as { value: string }[] | undefined)?.[0]?.value;
  if (!identifier) throw new Error("Missing accession");
  const panel = ((report.extension as { url: string; valueString: string }[] | undefined) ?? []).find((x) =>
    x.url.endsWith("panel-genes"),
  );
  const variants: Variant[] = [];
  for (const { resource } of bundle.entry) {
    if (resource.resourceType !== "Observation") continue;
    const comps = z.array(componentSchema).parse(resource.component);
    const get = (loinc: string) => comps.find((c) => c.code.coding.some((x) => x.code === loinc))?.valueCodeableConcept;
    const gene = get("48018-6")?.coding?.[0]?.code;
    const hgvs = get("48004-6")?.text;
    const zyg = LOINC_TO_ZYG[get("53034-5")?.coding?.[0]?.code ?? ""];
    const acmg = LOINC_TO_ACMG[get("53037-8")?.coding?.[0]?.code ?? ""];
    const conditionId = get("81259-4")?.coding?.[0]?.code;
    const clinvarId = get("81252-9")?.coding?.[0]?.code ?? null;
    if (!gene || !hgvs || !zyg || !acmg || !conditionId) throw new Error("Malformed variant observation");
    variants.push({ gene, hgvs, zygosity: zyg, acmg, clinvarId, conditionId });
  }
  return {
    accession: identifier,
    issued: String(report.issued ?? ""),
    labName: String((report.performer as { display: string }[] | undefined)?.[0]?.display ?? ""),
    panelGenes: panel ? panel.valueString.split(",").filter(Boolean) : [],
    variants,
  };
}
