"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { Switch } from "@/components/ui/controls";
import { sceneAt, type VideoScript } from "@/lib/video/script";
import { ResultVideo, type ResultVideoProps } from "./result-video";

const Player = dynamic(() => import("@remotion/player").then((m) => m.Player), { ssr: false, loading: () => <div aria-hidden className="skeleton aspect-video w-full rounded-card" /> });

/**
 * My Result Video in the browser (Remotion Player). Nothing is uploaded or rendered on a server.
 * Narration uses the browser's own voice; with Azure it would be Azure AI Speech (lib/features.ts).
 */
export function ResultVideoPlayer({ script, locale, labels, ui }: { script: VideoScript; locale: "ar" | "en"; labels: ResultVideoProps["labels"]; ui: { narrate: string; narrateDesc: string; playerLabel: string } }) {
  const ref = useRef<PlayerRef>(null);
  const [narrate, setNarrate] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [ready, setReady] = useState(false);
  const spoken = useRef(-1);

  useEffect(() => setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window), []);

  useEffect(() => {
    const player = ref.current;
    if (!player || !narrate || !canSpeak) return;
    const speak = (index: number) => {
      if (index === spoken.current) return;
      spoken.current = index;
      window.speechSynthesis.cancel();
      const caption = script.scenes[index].caption;
      const u = new SpeechSynthesisUtterance(locale === "ar" ? caption.ar : caption.en);
      u.lang = locale === "ar" ? "ar-AE" : "en-US";
      u.rate = 0.96;
      window.speechSynthesis.speak(u);
    };
    const onFrame = (e: { detail: { frame: number } }) => player.isPlaying() && speak(sceneAt(script, e.detail.frame));
    const stop = () => {
      window.speechSynthesis.cancel();
      spoken.current = -1;
    };
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("pause", stop);
    player.addEventListener("ended", stop);
    player.addEventListener("seeked", stop);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("pause", stop);
      player.removeEventListener("ended", stop);
      player.removeEventListener("seeked", stop);
      stop();
    };
  }, [narrate, canSpeak, script, locale, ready]);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-card border border-glass-border shadow-[var(--glow-float)]" data-result-video={script.scenes.length} aria-label={ui.playerLabel} role="group" dir="ltr">
        <Player
          ref={(r: PlayerRef | null) => {
            ref.current = r;
            if (r && !ready) setReady(true);
          }}
          // The lazily loaded Player loses its generic props type, so the component is passed loosely typed.
          component={ResultVideo as unknown as React.ComponentType<Record<string, unknown>>}
          inputProps={{ script, locale, labels }}
          durationInFrames={script.totalFrames}
          fps={script.fps}
          compositionWidth={script.width}
          compositionHeight={script.height}
          style={{ width: "100%", aspectRatio: `${script.width} / ${script.height}` }}
          controls
          // Open on the title scene rather than a blank first frame.
          initialFrame={24}
          acknowledgeRemotionLicense
        />
      </div>
      {canSpeak && <Switch checked={narrate} onChange={setNarrate} label={ui.narrate} description={ui.narrateDesc} />}
    </div>
  );
}
