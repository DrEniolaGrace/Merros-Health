import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { checkOutput } from "@/lib/ai/safety";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

const EMPTY = { passages: [], numbers: [], notes: [] };
const BANNED_EN = /incompatib|not (genetically )?compatible|genetically (unsuitable|unfit)/i;
const BANNED_AR = /غير متوافق|عدم (ال)?توافق|غير متلائم/;

function strings(o: unknown): string[] {
  if (typeof o === "string") return [o];
  if (o && typeof o === "object") return Object.values(o).flatMap(strings);
  return [];
}
function files(dir: string, ext: RegExp): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p, ext) : ext.test(e.name) ? [p] : [];
  });
}

describe("a couple is never labelled incompatible", () => {
  it("in any user facing text, in either language", () => {
    for (const s of strings(en)) expect(s, s).not.toMatch(BANNED_EN);
    for (const s of strings(ar)) expect(s, s).not.toMatch(BANNED_AR);
  });

  it("in content, the video script, the README or the docs", () => {
    const sources = [...files("content", /\.ts$/), "lib/video/script.ts", "README.md", ...files("docs", /\.md$/), "eval/golden.jsonl"];
    for (const f of sources) {
      const text = fs.readFileSync(f, "utf8");
      expect(text, f).not.toMatch(BANNED_EN);
      expect(text, f).not.toMatch(BANNED_AR);
    }
  });

  it("and the Safety Verifier blocks the Copilot from saying it", () => {
    for (const s of ["You two are genetically incompatible.", "Your genetic incompatibility means...", "You are not compatible as a couple.", "This is a bad match."]) {
      expect(checkOutput(s, EMPTY).map((h) => h.kind), s).toContain("stigmatising");
    }
    for (const s of ["أنتما غير متوافقين وراثياً.", "هناك عدم توافق جيني بينكما."]) {
      expect(checkOutput(s, EMPTY).map((h) => h.kind), s).toContain("stigmatising");
    }
    expect(checkOutput("You have a shared carrier result.", EMPTY)).toEqual([]);
    expect(checkOutput("لديكما نتيجة حمل مشتركة.", EMPTY)).toEqual([]);
  });
});

describe("Your plan", () => {
  it("exists in both languages with the same keys", () => {
    const keys = (o: object, p = ""): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
    expect(keys(ar.plan).sort()).toEqual(keys(en.plan).sort());
    for (const ctx of ["carrier", "uncertain", "shared", "beyond"] as const) {
      expect(en.plan.intro[ctx]).toBeTruthy();
      expect(en.plan.counsellingBody[ctx]).toBeTruthy();
    }
  });

  it("is non directive: every line passes the Safety Verifier rules", () => {
    for (const s of strings(en.plan)) expect(checkOutput(s, EMPTY), s).toEqual([]);
    for (const s of strings(ar.plan)) expect(checkOutput(s, EMPTY), s).toEqual([]);
    expect(en.plan.note).toMatch(/never tells you whom to marry or what to decide/);
  });

  it("uses the shared carrier result wording", () => {
    expect(en.couple.sharedResultTitle).toBe("Your shared carrier result");
    expect(ar.couple.sharedResultTitle).toContain("نتيجة الحمل المشتركة");
    expect(en.plan.intro.shared).toMatch(/shared carrier result/);
  });
});

describe("Guided tour", () => {
  type Tour = Record<string, unknown> & { explore: Record<string, { title: string; body: string }> };
  const tourEn = en.tour as unknown as Tour;
  const tourAr = ar.tour as unknown as Tour;
  it("follows the story of the demo video in six steps, then Explore more", () => {
    const src = fs.readFileSync("components/tour/judge-tour.tsx", "utf8");
    const steps = [...src.slice(src.indexOf("const STEPS"), src.indexOf("const COUNT")).matchAll(/key: "([a-z]+)"/g)].map((m) => m[1]);
    expect(steps).toEqual(["welcome", "result", "match", "brief", "living", "signals"]);
    for (const k of steps) {
      for (const t of [tourEn, tourAr]) expect((t[k] as { title: string; body: string }).body, k).toBeTruthy();
    }
    expect((tourEn.welcome as { body: string }).body).toBe("This short tour walks you through Merros in about 4 minutes, following one couple, Mariam and Khalid, from result day to a year later. Buttons marked Presenter control simulate things that normally take months or two phones. You can leave the tour at any time.");
    const explore = [...src.slice(src.indexOf("const EXPLORE"), src.indexOf("export function JudgeTour")).matchAll(/key: "([a-zA-Z]+)"/g)].map((m) => m[1]);
    expect(explore).toEqual(["copilot", "family", "beyond", "findCare", "values", "privacy"]);
    for (const k of explore) for (const t of [tourEn, tourAr]) expect(t.explore[k].body, k).toBeTruthy();
  });

  it("no user facing text mentions Azure, phases or unfinished work", () => {
    const walk = (o: unknown, out: string[] = []): string[] => {
      if (typeof o === "string") out.push(o);
      else if (o && typeof o === "object") for (const v of Object.values(o)) walk(v, out);
      return out;
    };
    for (const text of [...walk(en), ...walk(ar)]) {
      expect(text).not.toMatch(/Azure|Phase d|in a later phase|المرحلة|coming soon|TODO|lorem/i);
    }
  });
});
