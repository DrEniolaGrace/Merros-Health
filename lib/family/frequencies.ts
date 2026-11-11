/**
 * Population carrier frequencies (f) used by the Family Risk Engine.
 *
 * ILLUSTRATIVE VALUES for the prototype, chosen from ranges reported in the literature for Gulf
 * populations. They are NOT verified against gnomAD or the Greater Middle East Variome and must
 * be replaced with sourced, population specific values before any real use (SPEC 9: Emirati
 * calibrated frequencies are on the roadmap). The interface always shows the value used.
 */
export interface CarrierFrequency {
  gene: string;
  f: number;
  population: string;
  note: string;
}

export const CARRIER_FREQUENCIES: Record<string, CarrierFrequency> = {
  HBB: { gene: "HBB", f: 0.085, population: "UAE nationals (illustrative)", note: "Beta thalassaemia trait; published UAE estimates are around 8 to 9 percent." },
  SMN1: { gene: "SMN1", f: 0.02, population: "General (illustrative)", note: "About 1 in 50 in many populations." },
  GJB2: { gene: "GJB2", f: 0.025, population: "General (illustrative)", note: "About 1 in 40; varies by variant and population." },
  CFTR: { gene: "CFTR", f: 0.02, population: "General (illustrative)", note: "Lower in many Gulf populations; varies widely." },
};

export const DEFAULT_FREQUENCY: CarrierFrequency = { gene: "*", f: 0.02, population: "General (illustrative)", note: "Default used when no gene specific value is available." };

export function frequencyFor(gene: string): CarrierFrequency {
  return CARRIER_FREQUENCIES[gene] ?? { ...DEFAULT_FREQUENCY, gene };
}
