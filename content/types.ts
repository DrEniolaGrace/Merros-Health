import type { SafetyKind } from "@/components/ui/pill";

export type Bi = { en: string; ar: string };
export type ReadingLevel = "simple" | "standard" | "detailed";
export type ByLevel = Record<ReadingLevel, Bi>;

export interface Source {
  title: string;
  url: string;
}

/**
 * Every content item carries exactly one safety boundary label (SPEC 4.7).
 * Curated items may be education or decision support. Clinical advice can only exist when
 * signed by a named accredited human, so the type forbids it here.
 */
export interface ContentMeta {
  id: string;
  version: number;
  label: Exclude<SafetyKind, "clinical_advice">;
  source: "curated" | "ai";
  reviewStatus: "pending_accredited_review";
  sources: Source[];
}

export const pick = (b: Bi, locale: string) => (locale === "ar" ? b.ar : b.en);
