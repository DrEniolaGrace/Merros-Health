/**
 * Copilot answers cite approved passages as [id], for example [explainer.carrier] or
 * [explainer.acmg#likely_benign]. The markers are read to list the sources, then removed from the
 * text a person sees or hears. One pattern for both, so no marker can slip through to the screen.
 */
export const CITATION_ID = /^[a-z0-9][a-z0-9._#-]*$/i;
const MARKER = /\[([a-z0-9][a-z0-9._#-]*)\]/gi;
const MARKER_WITH_SPACE = /\s*\[[a-z0-9][a-z0-9._#-]*\]/gi;

/** Ids in the order they are cited, without repeats. */
export function citationIds(text: string): string[] {
  return [...new Set([...text.matchAll(MARKER)].map((m) => m[1]))];
}

/** The text without its citation markers. */
export function stripCitations(text: string): string {
  return text.replace(MARKER_WITH_SPACE, "").trim();
}

/** Anything still shaped like a raw key, such as [explainer.acmg] or [nav.result], should never be shown. */
export const RAW_KEY = /\[[a-z][a-z0-9_-]*(?:[.#][a-z0-9_-]+)+\]/i;
