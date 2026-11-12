"use server";

import { requireUser } from "@/lib/auth/session";
import { recognise, speechConfig, speakable, synthesize, MAX_SPEECH_CHARS, type VoiceLocale } from "@/lib/voice/azure";
import { MAX_SECONDS, TARGET_RATE } from "@/lib/voice/wav";

const asLocale = (l: string): VoiceLocale => (l === "ar" ? "ar" : "en");

/**
 * Text to speech. Returns MP3 audio from Azure AI Speech, or tells the browser to use its own
 * voice when no key is configured or the service fails. Only already verified answer text is sent.
 */
export async function speak(text: string, locale: string): Promise<{ mode: "azure"; audio: string } | { mode: "browser" }> {
  await requireUser();
  const cfg = speechConfig();
  const clean = speakable(String(text)).slice(0, MAX_SPEECH_CHARS);
  if (!cfg || !clean) return { mode: "browser" };
  try {
    const audio = await synthesize(cfg, clean, asLocale(locale));
    return { mode: "azure", audio: Buffer.from(audio).toString("base64") };
  } catch (e) {
    console.error(e);
    return { mode: "browser" };
  }
}

/** Speech to text for one short spoken question (16 kHz mono WAV). The audio is not stored. */
export async function transcribe(form: FormData): Promise<{ ok: true; text: string } | { ok: false; reason: "not_configured" | "too_long" | "not_understood" | "failed" }> {
  await requireUser();
  const cfg = speechConfig();
  if (!cfg) return { ok: false, reason: "not_configured" };
  const file = form.get("audio");
  if (!(file instanceof Blob)) return { ok: false, reason: "failed" };
  if (file.size > 44 + TARGET_RATE * 2 * (MAX_SECONDS + 1)) return { ok: false, reason: "too_long" };
  try {
    const text = await recognise(cfg, await file.arrayBuffer(), asLocale(String(form.get("locale"))));
    return text ? { ok: true, text } : { ok: false, reason: "not_understood" };
  } catch (e) {
    console.error(e);
    return { ok: false, reason: "failed" };
  }
}
