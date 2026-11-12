"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speak, transcribe } from "@/lib/actions/voice";
import { speakable, STT_LOCALE, type VoiceLocale } from "@/lib/voice/azure";
import { concat, downsample, encodeWav, MAX_SECONDS } from "@/lib/voice/wav";

export type VoiceError = "mic_denied" | "not_understood" | "too_long" | "failed";

interface BrowserRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => BrowserRecognition;

const browserRecognition = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/**
 * Voice for the Copilot (SPEC 6.5). With Azure AI Speech configured, audio goes through the
 * server to Azure (ar-AE and en-US). Without it, the browser's own speech features are used.
 * The microphone only works on a secure page (https or localhost).
 */
export function useVoice({ azure, locale }: { azure: boolean; locale: VoiceLocale }) {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [working, setWorking] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const mic = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
    setCanListen(azure ? mic : !!browserRecognition() && window.isSecureContext);
    setCanSpeak(azure || (typeof window !== "undefined" && "speechSynthesis" in window));
  }, [azure]);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  useEffect(() => () => {
    stopRef.current?.();
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speakBrowser = useCallback(
    (id: number, text: string) => {
      if (!("speechSynthesis" in window)) return setSpeakingId(null);
      const u = new SpeechSynthesisUtterance(speakable(text));
      u.lang = STT_LOCALE[locale];
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang === u.lang) ?? window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(locale));
      if (voice) u.voice = voice;
      u.rate = 0.96;
      u.onend = u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
      window.speechSynthesis.speak(u);
    },
    [locale],
  );

  const speakText = useCallback(
    async (id: number, text: string) => {
      stopSpeaking();
      setSpeakingId(id);
      if (!azure) return speakBrowser(id, text);
      const r = await speak(text, locale).catch(() => ({ mode: "browser" as const }));
      if (r.mode === "browser") return speakBrowser(id, text);
      const audio = new Audio(`data:audio/mpeg;base64,${r.audio}`);
      audioRef.current = audio;
      audio.onended = audio.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
      audio.play().catch(() => setSpeakingId(null));
    },
    [azure, locale, speakBrowser, stopSpeaking],
  );

  const stopListening = useCallback(() => stopRef.current?.(), []);

  const startListening = useCallback(
    async (onText: (text: string) => void) => {
      if (listening || working) return;
      setError(null);
      stopSpeaking();

      if (!azure) {
        const Ctor = browserRecognition();
        if (!Ctor) return;
        const rec = new Ctor();
        rec.lang = STT_LOCALE[locale];
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        let got = false;
        rec.onresult = (e) => {
          const t = e.results[0]?.[0]?.transcript?.trim();
          if (t) {
            got = true;
            onText(t);
          }
        };
        rec.onerror = (e) => setError(e.error === "not-allowed" || e.error === "service-not-allowed" ? "mic_denied" : e.error === "no-speech" ? "not_understood" : "failed");
        rec.onend = () => {
          setListening(false);
          stopRef.current = null;
          if (!got) setError((cur) => cur ?? "not_understood");
        };
        stopRef.current = () => rec.stop();
        setListening(true);
        rec.start();
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      } catch {
        return setError("mic_denied");
      }
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const silent = ctx.createGain();
      silent.gain.value = 0;
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node);
      node.connect(silent);
      silent.connect(ctx.destination);
      setListening(true);

      let done = false;
      const finish = async () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        stopRef.current = null;
        node.disconnect();
        source.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        const rate = ctx.sampleRate;
        await ctx.close().catch(() => undefined);
        setListening(false);
        const samples = concat(chunks);
        if (samples.length < rate * 0.3) return setError("not_understood");
        setWorking(true);
        try {
          const wav = encodeWav(downsample(samples, rate));
          const form = new FormData();
          form.set("audio", new Blob([wav.buffer as ArrayBuffer], { type: "audio/wav" }));
          form.set("locale", locale);
          const r = await transcribe(form);
          if (r.ok) onText(r.text);
          else setError(r.reason === "not_configured" ? "failed" : r.reason);
        } catch {
          setError("failed");
        } finally {
          setWorking(false);
        }
      };
      const timer = setTimeout(finish, MAX_SECONDS * 1000);
      stopRef.current = () => void finish();
    },
    [azure, listening, working, locale, stopSpeaking],
  );

  return { canListen, canSpeak, listening, working, speakingId, error, speakText, stopSpeaking, startListening, stopListening };
}
