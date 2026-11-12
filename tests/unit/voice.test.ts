import { describe, expect, it, vi } from "vitest";
import { buildSsml, DEFAULT_VOICE, mergeTranscripts, parseSttResponse, recognise, speakable, speechConfig, sttUrl, synthesize, ttsUrl } from "@/lib/voice/azure";
import { concat, downsample, encodeWav, TARGET_RATE } from "@/lib/voice/wav";

describe("Azure AI Speech configuration", () => {
  it("is off without a key, so the browser fallback is used", () => {
    expect(speechConfig({})).toBeNull();
    expect(speechConfig({ AZURE_SPEECH_KEY: "", AZURE_SPEECH_REGION: "uaenorth" })).toBeNull();
    expect(speechConfig({ AZURE_SPEECH_KEY: "k" })).toBeNull();
  });

  it("uses UAE Arabic and US English voices by default, and accepts overrides", () => {
    const cfg = speechConfig({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "uaenorth" })!;
    expect(cfg.voice).toEqual(DEFAULT_VOICE);
    expect(cfg.voice.ar.startsWith("ar-AE-")).toBe(true);
    expect(speechConfig({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "uaenorth", AZURE_SPEECH_VOICE_AR: "ar-AE-HamdanNeural" })!.voice.ar).toBe("ar-AE-HamdanNeural");
  });

  it("rejects a region that could change the host", () => {
    expect(speechConfig({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "evil.example.com/x" })).toBeNull();
  });

  it("builds regional endpoints with the right locales", () => {
    expect(ttsUrl("uaenorth")).toBe("https://uaenorth.tts.speech.microsoft.com/cognitiveservices/v1");
    expect(sttUrl("uaenorth", "ar")).toContain("language=ar-AE");
    expect(sttUrl("uaenorth", "en")).toContain("language=en-US");
  });
});

describe("spoken text", () => {
  it("drops citation markers and markdown symbols", () => {
    expect(speakable("Carriers are **healthy** [cond.beta-thal#carrier].\n\nAsk a counsellor.")).toBe("Carriers are healthy. Ask a counsellor.");
  });

  it("escapes markup so text cannot change the SSML", () => {
    const ssml = buildSsml(`5 < 6 & "ok" </voice><voice name='x'>`, "en", "en-US-JennyNeural");
    expect(ssml).toContain("5 &lt; 6 &amp; &quot;ok&quot; &lt;/voice&lt;voice name=&apos;x&apos;");
    expect(ssml.match(/<voice /g)).toHaveLength(1);
    expect(ssml).toContain('xml:lang="en-US"');
  });

  it("speaks Arabic with the UAE locale", () => {
    expect(buildSsml("مرحبا", "ar", DEFAULT_VOICE.ar)).toContain('xml:lang="ar-AE"');
  });
});

describe("browser speech results", () => {
  it("keeps one sentence when the browser repeats it as it grows", () => {
    expect(mergeTranscripts(["What does", "What does being", "What does being a", "What does being a carrier mean"])).toBe("What does being a carrier mean");
  });

  it("joins separate phrases in order", () => {
    expect(mergeTranscripts(["What is beta thalassaemia", " and what are our options "])).toBe("What is beta thalassaemia and what are our options");
  });

  it("ignores empty pieces and exact repeats", () => {
    expect(mergeTranscripts(["", "ما معنى حامل", "ما معنى حامل", "  "])).toBe("ما معنى حامل");
    expect(mergeTranscripts([])).toBe("");
  });
});

describe("speech service calls", () => {
  const cfg = speechConfig({ AZURE_SPEECH_KEY: "secret", AZURE_SPEECH_REGION: "uaenorth" })!;

  it("sends SSML with the key in a header and returns the audio", async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const audio = await synthesize(cfg, "Hello", "en", fetchMock as unknown as typeof fetch);
    expect(new Uint8Array(audio)).toEqual(new Uint8Array([1, 2, 3]));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(ttsUrl("uaenorth"));
    expect((init.headers as Record<string, string>)["Ocp-Apim-Subscription-Key"]).toBe("secret");
    expect(url).not.toContain("secret");
    expect(String(init.body)).toContain("Hello");
  });

  it("returns the transcript, or null when nothing was recognised", async () => {
    const ok = vi.fn(async () => Response.json({ RecognitionStatus: "Success", DisplayText: "ما معنى حامل؟" }));
    expect(await recognise(cfg, new ArrayBuffer(8), "ar", ok as unknown as typeof fetch)).toBe("ما معنى حامل؟");
    const none = vi.fn(async () => Response.json({ RecognitionStatus: "NoMatch" }));
    expect(await recognise(cfg, new ArrayBuffer(8), "ar", none as unknown as typeof fetch)).toBeNull();
  });

  it("throws on a service error so the caller can fall back", async () => {
    const bad = vi.fn(async () => new Response("no", { status: 401 }));
    await expect(synthesize(cfg, "Hello", "en", bad as unknown as typeof fetch)).rejects.toThrow("401");
    await expect(recognise(cfg, new ArrayBuffer(8), "en", bad as unknown as typeof fetch)).rejects.toThrow("401");
  });

  it("reads only successful recognition results", () => {
    expect(parseSttResponse({ RecognitionStatus: "Success", DisplayText: "  hi  " })).toBe("hi");
    expect(parseSttResponse({ RecognitionStatus: "Success", DisplayText: "" })).toBeNull();
    expect(parseSttResponse({ RecognitionStatus: "InitialSilenceTimeout" })).toBeNull();
    expect(parseSttResponse(null)).toBeNull();
  });
});

describe("microphone audio", () => {
  it("downsamples 48 kHz to 16 kHz by averaging", () => {
    const input = new Float32Array([0.3, 0.6, 0.9, -0.3, -0.6, -0.9]);
    const out = downsample(input, 48_000);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(0.6, 6);
    expect(out[1]).toBeCloseTo(-0.6, 6);
    expect(downsample(input, TARGET_RATE)).toBe(input);
    expect(() => downsample(input, 8000)).toThrow();
  });

  it("writes a valid 16 kHz mono 16 bit WAV header and clamps samples", () => {
    const wav = encodeWav(new Float32Array([0, 1, -1, 2, -2]));
    const v = new DataView(wav.buffer);
    const tag = (o: number) => String.fromCharCode(...wav.slice(o, o + 4));
    expect(tag(0)).toBe("RIFF");
    expect(tag(8)).toBe("WAVE");
    expect(tag(36)).toBe("data");
    expect(v.getUint16(20, true)).toBe(1);
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(16_000);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(10);
    expect(wav).toHaveLength(54);
    expect(v.getInt16(44, true)).toBe(0);
    expect(v.getInt16(46, true)).toBe(32767);
    expect(v.getInt16(48, true)).toBe(-32768);
    expect(v.getInt16(50, true)).toBe(32767);
    expect(v.getInt16(52, true)).toBe(-32768);
  });

  it("joins recorded chunks in order", () => {
    expect(Array.from(concat([new Float32Array([1, 2]), new Float32Array([3])]))).toEqual([1, 2, 3]);
  });
});
