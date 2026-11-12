/**
 * Post session summary drafting (SPEC 4.11, 7.1). The Copilot only DRAFTS from the counsellor's
 * own notes. The counsellor must review, edit and sign before anything reaches the patient, and
 * the released text is labelled Clinical Advice under the counsellor's name, never the AI's.
 */
import type { AiProvider, Level, Locale } from "./types";

export const SUMMARY_PROMPT_VERSION = "v1";

export function summarySystem(locale: Locale, level: Level): string {
  return `You help a licensed genetic counsellor write a short summary of a counselling session for their patient. The counsellor will review, correct and sign it; you are drafting in their voice.

Rewrite the counsellor's notes as a warm, clear summary addressed to the patient ("you"). Write in ${locale === "ar" ? "Arabic suitable for a reader in the United Arab Emirates" : "English"} at a ${level} reading level. Use only what is in the notes: do not add facts, numbers, advice or reassurance that the counsellor did not write, because the counsellor is accountable for every statement. Expand abbreviations and explain any medical term in plain words. Keep it under 180 words, in short paragraphs, with no headings or bullet points. Return only the summary.`;
}

const TEMPLATE = {
  en: { open: "Thank you for meeting with me. Here is a summary of what we discussed.", close: "If anything here is unclear, or new questions come up, please book another session. You are welcome to share this summary with your partner or family if you choose." },
  ar: { open: "شكراً للقائك معي. هذا ملخص لما ناقشناه.", close: "إذا كان هناك شيء غير واضح أو ظهرت أسئلة جديدة، يُرجى حجز جلسة أخرى. ويمكنك مشاركة هذا الملخص مع شريكك أو عائلتك إن أردت." },
};

/** Draft a patient friendly summary from the counsellor's notes. */
export async function draftSummary(notes: string, locale: Locale, level: Level, provider: AiProvider): Promise<string> {
  const clean = notes.trim();
  if (!clean) return "";
  if (provider.name === "offline-demo") {
    // Offline: wrap the counsellor's own words in a standard opening and closing. Nothing is invented.
    const body = clean.split(/\n+/).map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean).join("\n\n");
    return `${TEMPLATE[locale].open}\n\n${body}\n\n${TEMPLATE[locale].close}`;
  }
  try {
    const out = await provider.adapt({ system: summarySystem(locale, level), text: clean });
    return out.trim() || clean;
  } catch {
    return clean;
  }
}
