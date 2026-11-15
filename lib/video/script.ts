/**
 * My Result Video (SPEC 6.6): builds the scene list for a short personalised explainer from the
 * person's own result. Pure and deterministic. Every number comes from the tested risk engine.
 * The script holds no name, identifier, date or variant detail: only gene symbols and counts.
 */
import { perPregnancy, type PersonSummary } from "@/lib/risk/engine";
import { HALF, toPercentString } from "@/lib/risk/fraction";
import type { Bi } from "@/content/types";

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;
/** Seconds per scene. Five to six scenes give a 60 to 72 second video. */
export const SCENE_SECONDS = 12;

export type ResultKind = "carrier" | "no_changes" | "uncertain" | "needs_counsellor";

export type Scene =
  | { kind: "intro"; caption: Bi }
  | { kind: "carrier"; caption: Bi }
  | { kind: "result"; caption: Bi; result: ResultKind; genes: string[] }
  | { kind: "chance"; caption: Bi; affected: string; carrier: string; neither: string }
  | { kind: "options"; caption: Bi; count: number }
  | { kind: "next"; caption: Bi };

export interface VideoScript {
  fps: number;
  width: number;
  height: number;
  sceneFrames: number;
  totalFrames: number;
  scenes: Scene[];
}

/** Which of the four result stories applies. A finding that needs a counsellor always wins. */
export function resultKind(summary: PersonSummary): ResultKind {
  if (summary.genes.some((g) => g.status.kind === "needs_counsellor")) return "needs_counsellor";
  if (summary.vus.length > 0) return "uncertain";
  return summary.genes.some((g) => g.status.kind === "carrier") ? "carrier" : "no_changes";
}

const list = (genes: string[], and: string) => (genes.length <= 1 ? genes.join("") : `${genes.slice(0, -1).join(", ")} ${and} ${genes[genes.length - 1]}`);

function resultCaption(kind: ResultKind, genes: string[]): Bi {
  switch (kind) {
    case "carrier":
      return {
        en: genes.length === 1 ? `Your test found one gene change, in ${genes[0]}. You are a carrier, and you are healthy.` : `Your test found changes in ${genes.length} genes: ${list(genes, "and")}. You are a carrier, and you are healthy.`,
        ar: genes.length === 1 ? `وجد فحصك تغيراً جينياً واحداً في ${genes[0]}. أنت حامل، وأنت بصحة جيدة.` : `وجد فحصك تغيرات في ${genes.length} جينات: ${list(genes, "و")}. أنت حامل، وأنت بصحة جيدة.`,
      };
    case "no_changes":
      return {
        en: "Your test found no gene changes on this panel. That lowers the chance of being a carrier, but it does not make it zero.",
        ar: "لم يجد فحصك تغيرات جينية في هذه اللوحة. هذا يقلل احتمال أن تكون حاملاً، لكنه لا يجعله صفراً.",
      };
    case "uncertain":
      return {
        en: "Your test found a gene change that science cannot yet classify. It is not counted as a risk. A genetic counsellor will explain what it means for you.",
        ar: "وجد فحصك تغيراً جينياً لا يستطيع العلم تصنيفه بعد. لا يُحتسب خطراً. سيشرح لك مستشار وراثي معناه.",
      };
    case "needs_counsellor":
      return {
        en: "Your result includes a finding that is best explained in person. A genetic counsellor will go through it with you.",
        ar: "تتضمن نتيجتك أمراً يُفضَّل شرحه وجهاً لوجه. سيراجعه معك مستشار وراثي.",
      };
  }
}

export function buildScript(summary: PersonSummary, optionCount: number): VideoScript {
  const kind = resultKind(summary);
  const genes = summary.genes.filter((g) => g.status.kind === "carrier").map((g) => g.gene);
  const scenes: Scene[] = [
    { kind: "intro", caption: { en: "This is your result, explained in about a minute.", ar: "هذه نتيجتك، مشروحة في نحو دقيقة." } },
    {
      kind: "carrier",
      caption: {
        en: "Everyone has two copies of each gene. A carrier has one changed copy and one working copy. Carriers are usually healthy.",
        ar: "لكل شخص نسختان من كل جين. الحامل لديه نسخة متغيرة ونسخة سليمة. والحاملون أصحاء في العادة.",
      },
    },
    { kind: "result", caption: resultCaption(kind, genes), result: kind, genes: kind === "carrier" ? genes : [] },
  ];

  if (kind === "carrier") {
    // Two carriers of the same gene: each passes the changed copy on half the time.
    const o = perPregnancy(HALF, HALF);
    const affected = `${toPercentString(o.affected)}%`;
    const carrier = `${toPercentString(o.carrier)}%`;
    const neither = `${toPercentString(o.nonCarrier)}%`;
    scenes.push({
      kind: "chance",
      affected,
      carrier,
      neither,
      caption: {
        en: `If both partners carry a change in the same gene, each pregnancy has a ${affected} chance of an affected child, a ${carrier} chance of a healthy carrier, and a ${neither} chance of neither. These are chances, not certainties.`,
        ar: `إذا حمل الشريكان تغيراً في الجين نفسه، فلكل حمل احتمال ${affected} لطفل مصاب، و${carrier} لطفل حامل سليم، و${neither} لطفل غير حامل. هذه احتمالات لا يقين.`,
      },
    });
  }

  scenes.push(
    {
      kind: "options",
      count: optionCount,
      caption: {
        en: `There are ${optionCount} options to consider, and none is ranked above another. The choice belongs to you.`,
        ar: `هناك ${optionCount} خيارات للنظر فيها، ولا يُقدَّم أي منها على غيره. والاختيار لك.`,
      },
    },
    {
      kind: "next",
      caption: {
        en: "A result is not a diagnosis. A genetic counsellor can answer your questions whenever you are ready.",
        ar: "النتيجة ليست تشخيصاً. يمكن لمستشار وراثي أن يجيب عن أسئلتك متى كنت مستعداً.",
      },
    },
  );

  const sceneFrames = SCENE_SECONDS * FPS;
  return { fps: FPS, width: WIDTH, height: HEIGHT, sceneFrames, totalFrames: scenes.length * sceneFrames, scenes };
}

/** Which scene is on screen at a frame. */
export function sceneAt(script: VideoScript, frame: number): number {
  return Math.min(script.scenes.length - 1, Math.max(0, Math.floor(frame / script.sceneFrames)));
}
