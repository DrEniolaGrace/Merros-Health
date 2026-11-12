"use client";

import { useState } from "react";
import { Microphone, MicrophoneSlash, PhoneDisconnect, VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/** Simulated call controls. No camera or microphone is accessed in this phase. */
export function CallControls({ labels: L, leaveHref }: { labels: { mic: string; camera: string; leave: string; on: string; off: string }; leaveHref: string }) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const btn = "flex h-14 w-14 items-center justify-center rounded-full transition-[background,transform] duration-500 ease-calm active:scale-95";
  return (
    <div className="glass mx-auto flex items-center gap-3 rounded-full p-2 shadow-[var(--glow-float)]">
      <button aria-pressed={mic} aria-label={`${L.mic}: ${mic ? L.on : L.off}`} onClick={() => setMic((v) => !v)} className={cn(btn, mic ? "bg-glass-strong text-ink" : "bg-glass text-muted")}>
        {mic ? <Microphone size={22} /> : <MicrophoneSlash size={22} />}
      </button>
      <button aria-pressed={cam} aria-label={`${L.camera}: ${cam ? L.on : L.off}`} onClick={() => setCam((v) => !v)} className={cn(btn, cam ? "bg-glass-strong text-ink" : "bg-glass text-muted")}>
        {cam ? <VideoCamera size={22} /> : <VideoCameraSlash size={22} />}
      </button>
      <Link href={leaveHref} aria-label={L.leave} className={cn(btn, "bg-burgundy text-on-burgundy shadow-[var(--glow-primary)]")}>
        <PhoneDisconnect size={22} />
      </Link>
    </div>
  );
}
