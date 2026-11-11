/**
 * Claude provider (Anthropic API). Model and endpoint come from the environment (AI_MODEL,
 * AI_ENDPOINT, AI_API_KEY). Only de-identified text reaches the model: the question, approved
 * passages, engine numbers and gene level findings. Names, ids and dates are never sent.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AiProvider, ToolCall } from "../types";

const FALLBACK_BETA = "server-side-fallback-2026-07-01";
const MAX_TOOL_ROUNDS = 5;

type Effort = "low" | "medium" | "high";

const Verdict = z.object({ label: z.enum(["education", "decision_support", "prohibited"]), reason: z.string() });

export function anthropicProvider(opts: { apiKey: string; model: string; baseURL?: string; effort?: Effort }): AiProvider {
  const client = new Anthropic({ apiKey: opts.apiKey, ...(opts.baseURL ? { baseURL: opts.baseURL } : {}) });
  const effort: Effort = opts.effort ?? "low";

  /** One text completion. Server side fallbacks cover a safety classifier decline on the main model. */
  async function text(system: string, user: string, maxTokens = 4000): Promise<string> {
    const res = await client.beta.messages.create({
      model: opts.model,
      max_tokens: maxTokens,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: { effort },
      system,
      messages: [{ role: "user", content: user }],
    });
    if (res.stop_reason === "refusal") throw new Error("model_refused");
    return res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  }

  return {
    name: `claude:${opts.model}`,

    async interpret({ system, question, context, tools, runTool }) {
      const calls: ToolCall[] = [];
      const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `${context}\n\nQuestion: ${question}` }];
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const res = await client.beta.messages.create({
          model: opts.model,
          max_tokens: 4000,
          betas: [FALLBACK_BETA],
          fallbacks: "default",
          output_config: { effort },
          system,
          tools: tools.map((t) => ({ ...t, strict: true })),
          messages,
        });
        if (res.stop_reason === "refusal") throw new Error("model_refused");
        const uses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
        if (res.stop_reason !== "tool_use" || uses.length === 0) break;
        messages.push({ role: "assistant", content: res.content });
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = uses.map((u) => {
          const call: ToolCall = { name: u.name, input: (u.input ?? {}) as Record<string, unknown> };
          calls.push(call);
          return { type: "tool_result", tool_use_id: u.id, content: runTool(call) };
        });
        // All results for one assistant turn go back in a single user message.
        messages.push({ role: "user", content: results });
      }
      return { calls };
    },

    async explain({ system, question, factSheet, history, ctx }) {
      const sheet = JSON.stringify(
        { passages: factSheet.passages.map(({ id, title, text }) => ({ id, title, text })), numbers: factSheet.numbers, notes: factSheet.notes },
        null,
        1,
      );
      const earlier = history.length ? `Earlier in this conversation:\n${history.map((h) => `${h.role}: ${h.text}`).join("\n")}\n\n` : "";
      return text(
        system,
        `${earlier}Language: ${ctx.locale === "ar" ? "Arabic" : "English"}\nReading level: ${ctx.level}\n\n<fact_sheet>\n${sheet}\n</fact_sheet>\n\nQuestion: ${question}`,
      );
    },

    async adapt({ system, text: draft }) {
      return text(system, draft);
    },

    async classify({ system, text: draft }) {
      const res = await client.messages.parse({
        model: opts.model,
        max_tokens: 2000,
        output_config: { effort, format: zodOutputFormat(Verdict) },
        system,
        messages: [{ role: "user", content: `<draft>\n${draft}\n</draft>` }],
      });
      // A decline or an unparseable verdict is treated as unsafe: fail closed.
      return res.parsed_output ?? { label: "prohibited", reason: "no verdict returned" };
    },
  };
}
