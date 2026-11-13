import type { CopilotReply } from "./types";
import { PROMPT_VERSION } from "./prompts/v1";

const TEXT = {
  visitor: {
    en: "You have reached the limit of questions for this hour. Please come back a little later. Everything in Learn and Options stays available, and a genetic counsellor can help with anything urgent.",
    ar: "وصلت إلى الحد الأقصى من الأسئلة لهذه الساعة. عُد بعد قليل من فضلك. كل ما في «تعلّم» و«الخيارات» يبقى متاحاً، ويمكن لمستشار وراثي مساعدتك في أي أمر عاجل.",
  },
  site: {
    en: "The Copilot has reached its limit for today on this demonstration site. Everything in Learn and Options stays available, and a genetic counsellor can help with anything urgent.",
    ar: "وصل المساعد إلى حده اليومي في هذا الموقع التجريبي. كل ما في «تعلّم» و«الخيارات» يبقى متاحاً، ويمكن لمستشار وراثي مساعدتك في أي أمر عاجل.",
  },
} as const;

/** The answer given when a rate limit is reached. Nothing was sent to any model. */
export function rateLimitedReply(locale: "ar" | "en", scope: "visitor" | "site", provider: string): CopilotReply {
  return {
    text: TEXT[scope][locale],
    label: "education",
    citations: [],
    escalations: [],
    blocked: false,
    guard: [],
    steps: [{ agent: "orchestrator", detail: `rate_limited:${scope}` }],
    provider,
    promptVersion: PROMPT_VERSION,
  };
}
