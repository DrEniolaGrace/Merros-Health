import type { SafetyKind } from "@/components/ui/pill";
import type { EscalationCode } from "@/lib/escalation/rules";

export type Locale = "ar" | "en";
export type Level = "simple" | "standard" | "detailed";

/** One retrievable piece of approved content. */
export interface Passage {
  id: string;
  title: string;
  text: string;
  label: Exclude<SafetyKind, "clinical_advice">;
  /** In-app link for the citation, when there is a page for it. */
  href?: string;
}

/** A number produced by the deterministic risk engine (never by a model). */
export interface EngineNumber {
  label: string;
  value: string; // e.g. "25%"
}

/** Everything the Explainer is allowed to use. Built only from tool outputs. */
export interface FactSheet {
  passages: Passage[];
  numbers: EngineNumber[];
  notes: string[];
}

/** De-identified context: no names, ids, dates or contact details ever reach a model. */
export interface CopilotContext {
  locale: Locale;
  level: Level;
  /** The person's own findings, or null when they have no result or chose not to see it. */
  ownFindings: { gene: string; classification: string; condition: string }[] | null;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface AgentStep {
  agent: "orchestrator" | "interpreter" | "explainer" | "dialect" | "verifier" | "escalation";
  detail: string;
}

export interface CopilotReply {
  text: string;
  label: Exclude<SafetyKind, "clinical_advice">;
  citations: { id: string; title: string; href?: string }[];
  /** Escalation reasons to record (SPEC 4.8). */
  escalations: EscalationCode[];
  /** True when the Safety Verifier replaced the draft. */
  blocked: boolean;
  guard: { stage: "input" | "rules" | "classifier"; rule: string; action: string }[];
  steps: AgentStep[];
  provider: string;
  promptVersion: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required: string[]; additionalProperties: false };
}

/**
 * Provider abstraction (SPEC 6.5). Implementations: mock (offline, deterministic) and Anthropic
 * (Claude). A provider never computes risk: numbers reach it only through tool results.
 */
export interface AiProvider {
  name: string;
  /** Variant Interpreter: decide which tools to call for this question. */
  interpret(input: { system: string; question: string; context: string; tools: ToolSpec[]; runTool: (call: ToolCall) => string }): Promise<{ calls: ToolCall[] }>;
  /** Explainer: write the answer from the fact sheet only, citing passage ids like [id]. */
  explain(input: { system: string; question: string; factSheet: FactSheet; history: ChatTurn[]; ctx: CopilotContext }): Promise<string>;
  /** Cultural and Dialect Adapter: natural Gulf Arabic, same facts, same citations. */
  adapt(input: { system: string; text: string }): Promise<string>;
  /** Safety Verifier, model stage. */
  classify(input: { system: string; text: string }): Promise<{ label: "education" | "decision_support" | "prohibited"; reason: string }>;
}
