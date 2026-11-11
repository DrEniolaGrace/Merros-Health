/**
 * Provider selection (SPEC 6.5). AI_PROVIDER=mock (default, offline) or anthropic (Claude).
 * Claude through Microsoft Foundry is the planned production route on Azure; Jais is a
 * documented Arabic model option (docs/RESPONSIBLE_AI.md).
 */
import type { AiProvider } from "./types";
import { mockProvider } from "./providers/mock";
import { anthropicProvider } from "./providers/anthropic";

export const DEFAULT_MODEL = "claude-opus-5-5";

export function getProvider(env: Record<string, string | undefined> = process.env): AiProvider {
  const kind = (env.AI_PROVIDER ?? "mock").toLowerCase();
  if (kind === "anthropic" || kind === "claude") {
    if (!env.AI_API_KEY) throw new Error("AI_PROVIDER=anthropic needs AI_API_KEY in .env");
    const effort = env.AI_EFFORT === "medium" || env.AI_EFFORT === "high" ? env.AI_EFFORT : "low";
    return anthropicProvider({ apiKey: env.AI_API_KEY, model: env.AI_MODEL || DEFAULT_MODEL, baseURL: env.AI_ENDPOINT || undefined, effort });
  }
  return mockProvider;
}
