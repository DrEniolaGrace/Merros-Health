import { describe, expect, it } from "vitest";
import { DISTRESS_THRESHOLD, ESCALATION_CODES, RULES, emptyContext, evaluateEscalation } from "@/lib/escalation/rules";
import { analyseCouple } from "@/lib/risk/engine";
import type { Variant } from "@/lib/risk/types";
import { persona } from "@/content/personas";

const carrier = (gene: string, extra: Partial<Variant> = {}): Variant => ({
  gene, hgvs: `${gene}:c.1A>G`, zygosity: "heterozygous", acmg: "pathogenic", clinvarId: null, conditionId: "x", ...extra,
});

describe("each rule fires and stays quiet correctly", () => {
  it("a baseline context fires nothing", () => {
    expect(evaluateEscalation(emptyContext())).toEqual([]);
    for (const code of ESCALATION_CODES) expect(RULES[code](emptyContext())).toBeNull();
  });

  it("shared pathogenic gene", () => {
    expect(RULES.shared_pathogenic_gene(emptyContext({ coupleSharedGenes: ["HBB", "GJB2"] }))).toEqual({
      code: "shared_pathogenic_gene", severity: "high", detail: "GJB2,HBB",
    });
  });

  it("any VUS", () => {
    expect(RULES.vus_present(emptyContext({ ownVariants: [carrier("HBB", { acmg: "vus" })] }))?.detail).toBe("HBB");
    expect(RULES.vus_present(emptyContext({ ownVariants: [carrier("HBB")] }))).toBeNull();
  });

  it("X linked finding", () => {
    expect(RULES.significant_personal_finding(emptyContext({ ownVariants: [carrier("G6PD", { zygosity: "hemizygous" })] }))?.detail).toBe("G6PD");
  });
  it("unknown gene finding", () => {
    expect(RULES.significant_personal_finding(emptyContext({ ownVariants: [carrier("ABC1")] }))).not.toBeNull();
  });
  it("homozygous AR finding", () => {
    expect(RULES.significant_personal_finding(emptyContext({ ownVariants: [carrier("HBB", { zygosity: "homozygous" })] }))).not.toBeNull();
  });
  it("two P/LP variants in one AR gene", () => {
    expect(RULES.significant_personal_finding(emptyContext({ ownVariants: [carrier("HBB", { hgvs: "a" }), carrier("HBB", { hgvs: "b" })] }))).not.toBeNull();
  });
  it("a simple heterozygous AR carrier is not a significant personal finding", () => {
    expect(RULES.significant_personal_finding(emptyContext({ ownVariants: [carrier("HBB")] }))).toBeNull();
  });
  it("a VUS in an X linked gene is not a significant finding (it is a VUS escalation)", () => {
    const ctx = emptyContext({ ownVariants: [carrier("G6PD", { acmg: "vus", zygosity: "hemizygous" })] });
    expect(RULES.significant_personal_finding(ctx)).toBeNull();
    expect(RULES.vus_present(ctx)).not.toBeNull();
  });

  it("pregnant is urgent, trying is high, others quiet", () => {
    expect(RULES.pregnant_or_trying(emptyContext({ pregnancyStatus: "pregnant" }))?.severity).toBe("urgent");
    expect(RULES.pregnant_or_trying(emptyContext({ pregnancyStatus: "trying" }))?.severity).toBe("high");
    expect(RULES.pregnant_or_trying(emptyContext({ pregnancyStatus: "none" }))).toBeNull();
    expect(RULES.pregnant_or_trying(emptyContext({ pregnancyStatus: "prefer_not_to_say" }))).toBeNull();
  });

  it("distress at or above threshold", () => {
    expect(RULES.high_distress(emptyContext({ distressScore: DISTRESS_THRESHOLD }))).not.toBeNull();
    expect(RULES.high_distress(emptyContext({ distressScore: DISTRESS_THRESHOLD - 1 }))).toBeNull();
    expect(RULES.high_distress(emptyContext({ distressScore: 0 }))).toBeNull();
  });

  it("teach back failed twice on the same question", () => {
    const twice = [{ questionId: "q1", correct: false }, { questionId: "q1", correct: false }];
    const spread = [{ questionId: "q1", correct: false }, { questionId: "q2", correct: false }];
    expect(RULES.teachback_failed_twice(emptyContext({ teachBackAttempts: twice }))).not.toBeNull();
    expect(RULES.teachback_failed_twice(emptyContext({ teachBackAttempts: spread }))).toBeNull();
  });

  it("medical advice, safety verifier, reclassification and Risk Beyond the Panel hooks", () => {
    expect(RULES.medical_advice_requested(emptyContext({ medicalAdviceRequested: true }))).not.toBeNull();
    expect(RULES.safety_verifier_block(emptyContext({ safetyVerifierBlocked: true }))).not.toBeNull();
    expect(RULES.variant_reclassified(emptyContext({ variantReclassified: true }))?.severity).toBe("high");
    expect(RULES.risk_beyond_panel_result(emptyContext({ riskBeyondPanelResult: true }))?.severity).toBe("high");
  });
});

describe("aggregation", () => {
  it("returns every reason, most severe first", () => {
    const r = evaluateEscalation(emptyContext({
      ownVariants: [carrier("HBB", { acmg: "vus" })],
      coupleSharedGenes: ["HBB"],
      pregnancyStatus: "pregnant",
      medicalAdviceRequested: true,
    }));
    expect(r.map((e) => e.code)).toEqual(["pregnant_or_trying", "shared_pathogenic_gene", "vus_present", "medical_advice_requested"]);
    expect(r.map((e) => e.severity)).toEqual(["urgent", "high", "routine", "routine"]);
  });
});

describe("persona expectations", () => {
  const forPersona = (key: string, partnerKey?: string) => {
    const p = persona(key);
    const shared = partnerKey ? analyseCouple(p.variants ?? [], persona(partnerKey).variants ?? []).sharedGenes : [];
    return evaluateEscalation(emptyContext({ ownVariants: p.variants ?? [], coupleSharedGenes: shared, pregnancyStatus: p.pregnancyStatus }))
      .map((e) => e.code);
  };
  it("Mariam and Khalid escalate for their shared genes (Mariam also for her CFTR VUS)", () => {
    expect(forPersona("mariam", "khalid")).toEqual(["shared_pathogenic_gene", "vus_present"]);
    expect(forPersona("khalid", "mariam")).toEqual(["shared_pathogenic_gene"]);
  });
  it("Noura does not escalate (carrier, partner not a carrier)", () => {
    expect(forPersona("noura", "faisal")).toEqual([]);
  });
  it("Hamad escalates for his VUS", () => expect(forPersona("hamad")).toEqual(["vus_present"]));
  it("Aisha, a sickle cell trait carrier, does not escalate by default", () => expect(forPersona("aisha")).toEqual([]));
  it("Sara escalates because she is trying to conceive", () => expect(forPersona("sara")).toEqual(["pregnant_or_trying"]));
});
