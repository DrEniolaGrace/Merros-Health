/**
 * The Abu Dhabi premarital genetic screening panel: Appendix 12 of the Department of Health
 * Premarital Screening Standard (DoH/STD/PSS/V3, September 2024), mapped to current HGNC symbols.
 * See data/reference/doh-pms-panel.json for the source, method and notes.
 *
 * Merros is not affiliated with or endorsed by the Department of Health.
 */
import data from "@/data/reference/doh-pms-panel.json";

export interface PanelGene {
  symbol: string;
  /** Older names printed in the standard or replaced by HGNC since publication. */
  aliases?: string[];
  printedWithAsterisk?: boolean;
}

export const PANEL: PanelGene[] = data.genes;
export const PANEL_GENES: string[] = PANEL.map((g) => g.symbol);
export const PANEL_SOURCE = data.source;
export const PANEL_SCOPE = data.scope;

const SET = new Set(PANEL_GENES);
const BY_ALIAS = new Map<string, string[]>();
for (const g of PANEL) for (const a of g.aliases ?? []) BY_ALIAS.set(a.toUpperCase(), [...(BY_ALIAS.get(a.toUpperCase()) ?? []), g.symbol]);

export const onPanel = (symbol: string) => SET.has(symbol);

/** Current panel symbols for a name: itself if current, or every gene that has it as an older name. */
export function resolvePanelName(name: string): string[] {
  const n = name.trim().toUpperCase();
  const direct = PANEL_GENES.find((s) => s.toUpperCase() === n);
  return direct ? [direct] : (BY_ALIAS.get(n) ?? []);
}

export const aliasesOf = (symbol: string): string[] => PANEL.find((g) => g.symbol === symbol)?.aliases ?? [];
