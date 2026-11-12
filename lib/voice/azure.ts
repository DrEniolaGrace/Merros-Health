/**
 * Azure AI Speech (SPEC 6.5 voice mode) through its REST endpoints, called only from the server so
 * the key never reaches the browser. Without a key the app falls back to the browser's own speech
 * features (local development).
 *
 * What leaves the app: the audio of the spoken question, and the already verified answer text.
 * No name, identifier or result file is sent.
 */
export type VoiceLocale = "ar" | "en";

/** Speech to text locales: Gulf (UAE) Arabic and US English. */
export const STT_LOCALE: Record<VoiceLocale, string> = { ar: "ar-AE", en: "en-US" };

/** Default neural voices. Override with AZURE_SPEECH_VOICE_AR / AZURE_SPEECH_VOICE_EN (check the current list in the Azure portal). */
export const DEFAULT_VOICE: Record<VoiceLocale, string> = { ar: "ar-AE-FatimaNeural", en: "en-US-JennyNeural" };

export interface SpeechConfig {
  key: string;
  region: string;
  voice: Record<VoiceLocale, string>;
}

export function speechConfig(env: Record<string, string | undefined> = process.env): SpeechConfig | null {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();
  if (!key || !region || !/^[a-z0-9]+$/.test(region)) return null;
  return { key, region, voice: { ar: env.AZURE_SPEECH_VOICE_AR?.trim() || DEFAULT_VOICE.ar, en: env.AZURE_SPEECH_VOICE_EN?.trim() || DEFAULT_VOICE.en } };
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Text as it should be spoken: no citation markers, no markdown symbols, single spaces. */
export function speakable(text: string): string {
  return text
    .replace(/\s*\[[a-z0-9.#-]+\]/gi, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const MAX_SPEECH_CHARS = 3000;

/**
 * Joins the pieces a browser speech recogniser reports into one sentence. Some browsers report
 * separate phrases; others repeat the whole sentence so far each time ("What does", "What does
 * being", ...). A piece that repeats what is already there replaces it instead of being added.
 */
export function mergeTranscripts(parts: string[]): string {
  let acc = "";
  for (const raw of parts) {
    const t = raw.replace(/\s+/g, " ").trim();
    if (!t) continue;
    if (!acc || t.toLowerCase().startsWith(acc.toLowerCase())) acc = t;
    else if (!acc.toLowerCase().endsWith(t.toLowerCase())) acc = `${acc} ${t}`;
  }
  return acc;
}

export function buildSsml(text: string, locale: VoiceLocale, voice: string): string {
  const body = escapeXml(speakable(text).slice(0, MAX_SPEECH_CHARS));
  return `<speak version="1.0" xml:lang="${STT_LOCALE[locale]}"><voice name="${escapeXml(voice)}"><prosody rate="-4%">${body}</prosody></voice></speak>`;
}

export const ttsUrl = (region: string) => `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
export const sttUrl = (region: string, locale: VoiceLocale) =>
  `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${STT_LOCALE[locale]}&format=simple`;

/** Reads the short audio recognition response. Returns the transcript, or null if nothing was recognised. */
export function parseSttResponse(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const r = json as { RecognitionStatus?: unknown; DisplayText?: unknown };
  if (r.RecognitionStatus !== "Success" || typeof r.DisplayText !== "string") return null;
  const t = r.DisplayText.trim();
  return t.length ? t : null;
}

export async function synthesize(cfg: SpeechConfig, text: string, locale: VoiceLocale, fetchImpl: typeof fetch = fetch): Promise<ArrayBuffer> {
  const res = await fetchImpl(ttsUrl(cfg.region), {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": cfg.key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "merros" },
    body: buildSsml(text, locale, cfg.voice[locale]),
  });
  if (!res.ok) throw new Error(`Azure text to speech failed (${res.status})`);
  return res.arrayBuffer();
}

export async function recognise(cfg: SpeechConfig, wav: ArrayBuffer, locale: VoiceLocale, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const res = await fetchImpl(sttUrl(cfg.region, locale), {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": cfg.key, "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", Accept: "application/json" },
    body: wav,
  });
  if (!res.ok) throw new Error(`Azure speech to text failed (${res.status})`);
  return parseSttResponse(await res.json());
}
