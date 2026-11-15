import { describe, expect, it } from "vitest";
import { buildScript, FPS, resultKind, SCENE_SECONDS, sceneAt } from "@/lib/video/script";
import { summarisePerson } from "@/lib/risk/engine";
import type { Variant } from "@/lib/risk/types";
import { checkOutput } from "@/lib/ai/safety";
import { PERSONAS } from "@/content/personas";

const v = (gene: string, acmg: Variant["acmg"] = "pathogenic", zygosity: Variant["zygosity"] = "heterozygous"): Variant =>
  ({ gene, hgvs: "c.1A>G", zygosity, acmg, clinvarId: "1", conditionId: "x" }) as Variant;

const carrier2 = summarisePerson([v("HBB"), v("GJB2")]);
const none = summarisePerson([]);
const vus = summarisePerson([v("HBB", "vus")]);
const homozygous = summarisePerson([v("HBB", "pathogenic", "homozygous")]);

describe("My Result Video script", () => {
  it("picks the right story for each kind of result", () => {
    expect(resultKind(carrier2)).toBe("carrier");
    expect(resultKind(none)).toBe("no_changes");
    expect(resultKind(vus)).toBe("uncertain");
    expect(resultKind(homozygous)).toBe("needs_counsellor");
  });

  it("a carrier gets six scenes, with the chances from the risk engine", () => {
    const s = buildScript(carrier2, 7);
    expect(s.scenes.map((x) => x.kind)).toEqual(["intro", "carrier", "result", "chance", "options", "next"]);
    const chance = s.scenes.find((x) => x.kind === "chance")!;
    expect(chance).toMatchObject({ affected: "25%", carrier: "50%", neither: "25%" });
    const result = s.scenes.find((x) => x.kind === "result")!;
    expect(result).toMatchObject({ result: "carrier", genes: ["GJB2", "HBB"] });
    expect(result.caption.en).toContain("2 genes");
  });

  it("gives no chance scene and no gene list unless the person is a plain carrier", () => {
    for (const summary of [none, vus, homozygous]) {
      const s = buildScript(summary, 7);
      expect(s.scenes.map((x) => x.kind)).toEqual(["intro", "carrier", "result", "options", "next"]);
      expect(s.scenes.find((x) => x.kind === "result")).toMatchObject({ genes: [] });
    }
    expect(buildScript(vus, 7).scenes[2].caption.en).toMatch(/counsellor/);
    expect(buildScript(homozygous, 7).scenes[2].caption.en).toMatch(/counsellor/);
  });

  it("runs 60 to 90 seconds", () => {
    for (const summary of [carrier2, none, vus, homozygous]) {
      const s = buildScript(summary, 7);
      const seconds = s.totalFrames / s.fps;
      expect(seconds).toBeGreaterThanOrEqual(60);
      expect(seconds).toBeLessThanOrEqual(90);
      expect(s.totalFrames).toBe(s.scenes.length * SCENE_SECONDS * FPS);
    }
  });

  it("knows which scene is on screen", () => {
    const s = buildScript(carrier2, 7);
    expect(sceneAt(s, 0)).toBe(0);
    expect(sceneAt(s, s.sceneFrames - 1)).toBe(0);
    expect(sceneAt(s, s.sceneFrames)).toBe(1);
    expect(sceneAt(s, s.totalFrames + 500)).toBe(5);
    expect(sceneAt(s, -5)).toBe(0);
  });

  it("captions are bilingual, non directive, and use only engine numbers", () => {
    const sheet = { passages: [], numbers: [], notes: ["25% 50% 25%"] };
    for (const summary of [carrier2, none, vus, homozygous]) {
      for (const scene of buildScript(summary, 7).scenes) {
        expect(scene.caption.ar).toMatch(/[؀-ۿ]/);
        expect(checkOutput(scene.caption.en, sheet)).toEqual([]);
        expect(checkOutput(scene.caption.ar, sheet)).toEqual([]);
      }
    }
  });

  it("contains no name or identifier of any persona", () => {
    const names = PERSONAS.flatMap((p) => [p.nameEn, p.nameAr]);
    for (const summary of [carrier2, none, vus, homozygous]) {
      const text = JSON.stringify(buildScript(summary, 7));
      for (const n of names) expect(text).not.toContain(n);
      expect(text).not.toMatch(/c\.\d|VCV|SADL|@/); // no variant notation, ClinVar id, accession or contact
    }
  });

  it("says the options are not ranked and that a result is not a diagnosis", () => {
    const s = buildScript(carrier2, 7);
    expect(s.scenes.find((x) => x.kind === "options")!.caption.en).toMatch(/none is ranked/);
    expect(s.scenes.find((x) => x.kind === "next")!.caption.en).toMatch(/not a diagnosis/);
  });
});
