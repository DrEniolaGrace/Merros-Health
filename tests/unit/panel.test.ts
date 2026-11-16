import { describe, expect, it } from "vitest";
import { aliasesOf, onPanel, PANEL, PANEL_GENES, PANEL_SCOPE, PANEL_SOURCE, resolvePanelName } from "@/lib/risk/panel";
import { inheritanceOf } from "@/lib/risk/genes";
import { analyseCouple } from "@/lib/risk/engine";
import { PERSONAS } from "@/content/personas";
import { PATHWAY_STEPS, currentStep, furthestStep } from "@/lib/pathway/steps";
import data from "@/data/reference/doh-pms-panel.json";
import type { Variant } from "@/lib/risk/types";

describe("Abu Dhabi premarital genetic panel (DoH standard, Appendix 12)", () => {
  it("cites the document and version", () => {
    expect(PANEL_SOURCE.reference).toBe("DoH/STD/PSS/V3");
    expect(PANEL_SOURCE.version).toBe("3");
    expect(PANEL_SOURCE.published).toBe("September 2024");
    expect(PANEL_SOURCE.pages).toBe("46-47");
    expect(PANEL_SCOPE).toMatch(/Autosomal recessive genes only/);
  });

  it("has 563 unique current symbols from 570 printed entries", () => {
    expect(data.counts).toEqual({ printedEntries: 570, unique: 563, duplicatesMerged: 7, renamedSincePublication: 5, unmapped: 0 });
    expect(PANEL_GENES).toHaveLength(563);
    expect(new Set(PANEL_GENES).size).toBe(563);
    expect([...PANEL_GENES].sort()).toEqual(PANEL_GENES);
  });

  it("keeps the current symbol and stores the older name as an alias", () => {
    expect(aliasesOf("GBA1")).toContain("GBA");
    expect(aliasesOf("KARS1")).toContain("KARS");
    expect(aliasesOf("G6PC1")).toContain("G6PC");
    expect(aliasesOf("MMUT")).toContain("MUT");
    expect(aliasesOf("DRC4")).toContain("GAS8");
    expect(onPanel("GBA")).toBe(false);
    expect(onPanel("GBA1")).toBe(true);
    expect(resolvePanelName("gba")).toEqual(["GBA1"]);
    expect(resolvePanelName("GIF").sort()).toEqual(["CBLIF", "MIF", "MT3"]);
    expect(resolvePanelName("BRCA1")).toEqual([]);
  });

  it("lists no older name as a gene of its own", () => {
    const aliases = new Set(PANEL.flatMap((g) => g.aliases ?? []));
    for (const s of PANEL_GENES) expect(aliases.has(s), s).toBe(false);
  });

  it("contains every carrier gene a persona has", () => {
    for (const p of PERSONAS) for (const v of p.variants ?? []) expect(onPanel(v.gene), `${p.key}: ${v.gene}`).toBe(true);
  });

  it("has no X linked gene: G6PD is outside the panel but still routed to a counsellor", () => {
    expect(onPanel("G6PD")).toBe(false);
    expect(inheritanceOf("G6PD")).toBe("XL");
  });

  it("treats every panel gene as autosomal recessive, and anything else as unknown", () => {
    for (const g of PANEL_GENES) expect(inheritanceOf(g), g).toBe("AR");
    expect(inheritanceOf("BRCA1")).toBe("unknown");
  });

  it("lets the tested engine compute a couple's chance for any panel gene", () => {
    const v = (gene: string): Variant => ({ gene, hgvs: "c.1A>G", zygosity: "heterozygous", acmg: "pathogenic", clinvarId: "1", conditionId: "x" }) as Variant;
    const r = analyseCouple([v("GBA1")], [v("GBA1")]);
    expect(r.sharedGenes).toEqual(["GBA1"]);
    expect(r.needsCounsellor).toBe(false);
    const g = r.genes[0];
    expect(g.kind).toBe("computed");
    if (g.kind === "computed") expect(g.outcome.affected).toEqual({ num: 1, den: 4 });
    // A gene outside the panel and outside the engine is never computed.
    expect(analyseCouple([v("BRCA1")], [v("BRCA1")]).needsCounsellor).toBe(true);
  });
});

describe("care pathway, aligned with the DoH process", () => {
  it("follows the official order", () => {
    expect(PATHWAY_STEPS).toEqual(["screening_visit", "result_received", "confirmatory_testing", "understood", "counselling_booked", "counselling_completed", "report_issued", "specialist_service"]);
  });

  it("never puts someone on an optional step", () => {
    expect(PATHWAY_STEPS[currentStep(["screening_visit", "result_received"])]).toBe("understood");
    expect(PATHWAY_STEPS[currentStep([])]).toBe("screening_visit");
    expect(PATHWAY_STEPS[currentStep(["counselling_completed"])]).toBe("report_issued");
    expect(currentStep(["report_issued"])).toBe(-1);
    expect(furthestStep(["understood", "result_received"])).toBe(3);
  });
});
