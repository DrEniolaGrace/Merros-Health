import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadReadex } from "@remotion/google-fonts/ReadexPro";

const sora = loadSora();
const readex = loadReadex();
const FONT = `${sora.fontFamily}, ${readex.fontFamily}, sans-serif`;
const AR_FONT = `${readex.fontFamily}, sans-serif`;

/** Brand values from the design system (literal, so rendering needs no CSS variables). */
const C = {
  bg: "#0b0608",
  ink: "#f5eef0",
  muted: "#b7a3a9",
  burgundy: "#7d1a35",
  glow: "#c2415f",
  rose: "#f0a6b8",
  gold: "#e2c98f",
  line: "rgba(255,220,230,0.16)",
  glass: "rgba(22,12,16,0.82)",
};

export type Bi = { en: string; ar: string };

export interface TimelineScene {
  key: string;
  clip: string;
  index: number;
  title: Bi;
  text: Bi;
  evidence?: Bi;
  /** Kept parts of the clip, in source frames, played at `rate`. */
  segments: { from: number; to: number }[];
  rate: number;
  frames: number;
}

export interface DemoProps extends Record<string, unknown> {
  fps: number;
  titleFrames: number;
  closingFrames: number;
  scenes: TimelineScene[];
  captions: {
    placeholders: Record<string, string>;
    title: { eyebrow: Bi; heading: Bi; body: Bi };
    closing: { heading: Bi; evidence: Bi; link: string; note: Bi };
  };
}

/** Replaces [[NAME]] with the value, or shows a highlighted placeholder when there is none yet. */
function Fill({ text, values }: { text: string; values: Record<string, string> }) {
  const parts = text.split(/(\[\[[A-Z_]+\]\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^\[\[([A-Z_]+)\]\]$/.exec(p);
        if (!m) return <React.Fragment key={i}>{p}</React.Fragment>;
        const v = values[m[1]]?.trim();
        return v ? (
          <strong key={i} style={{ color: C.gold }}>{v}</strong>
        ) : (
          <span key={i} style={{ color: C.bg, background: C.gold, borderRadius: 8, padding: "0 10px", fontWeight: 600 }}>[[{m[1]}]]</span>
        );
      })}
    </>
  );
}

function Backdrop() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1400px 820px at 50% 120%, rgba(125,26,53,0.62), ${C.bg} 62%), radial-gradient(700px 400px at 85% -10%, rgba(226,201,143,0.10), transparent 70%)`,
      }}
    />
  );
}

function useRise(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
}

function Rise({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const p = useRise(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, ...style }}>{children}</div>;
}

function Fade({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 14, durationInFrames - 14, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-block", padding: "10px 22px", borderRadius: 999, border: `1.5px solid ${C.gold}`, color: C.gold, fontSize: 24, letterSpacing: 3, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function TitleCard({ c }: { c: DemoProps["captions"] }) {
  return (
    <Fade>
      <Backdrop />
      <AbsoluteFill style={{ padding: "0 200px", justifyContent: "center", gap: 34, fontFamily: FONT }}>
        <Rise><Eyebrow>{c.title.eyebrow.en} · <span style={{ fontFamily: AR_FONT }}>{c.title.eyebrow.ar}</span></Eyebrow></Rise>
        <Rise delay={8}>
          <h1 style={{ margin: 0, fontSize: 76, lineHeight: 1.08, fontWeight: 600, color: C.ink, maxWidth: 1400 }}>{c.title.heading.en}</h1>
        </Rise>
        <Rise delay={16}>
          <p style={{ margin: 0, fontSize: 36, lineHeight: 1.4, color: C.muted, maxWidth: 1300 }}>{c.title.body.en}</p>
        </Rise>
        <Rise delay={24}>
          <p style={{ margin: 0, fontSize: 30, lineHeight: 1.6, color: C.muted, maxWidth: 1300, direction: "rtl", fontFamily: AR_FONT, textAlign: "right" }}>{c.title.heading.ar}</p>
        </Rise>
      </AbsoluteFill>
    </Fade>
  );
}

function ClosingCard({ c }: { c: DemoProps["captions"] }) {
  return (
    <Fade>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34, textAlign: "center", padding: "0 220px", fontFamily: FONT }}>
        <Rise>
          <h1 style={{ margin: 0, fontSize: 84, fontWeight: 600, color: C.ink }}>{c.closing.heading.en}</h1>
        </Rise>
        <Rise delay={6}>
          <p style={{ margin: 0, fontSize: 40, color: C.muted, direction: "rtl", fontFamily: AR_FONT }}>{c.closing.heading.ar}</p>
        </Rise>
        <Rise delay={14}>
          <p style={{ margin: 0, fontSize: 38, color: C.ink }}><Fill text={c.closing.evidence.en} values={c.placeholders} /></p>
        </Rise>
        <Rise delay={22}>
          <p style={{ margin: 0, fontSize: 46, color: C.gold, letterSpacing: 1 }}>{c.closing.link}</p>
        </Rise>
        <Rise delay={30}>
          <p style={{ margin: 0, fontSize: 24, color: C.muted, maxWidth: 1300 }}>{c.closing.note.en}</p>
        </Rise>
      </AbsoluteFill>
    </Fade>
  );
}

/** Lower third: scene number and title, what it proves, and any testing evidence, in English with Arabic beneath. */
function Caption({ s, values }: { s: TimelineScene; values: Record<string, string> }) {
  const p = useRise(10);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 56px 44px", fontFamily: FONT, pointerEvents: "none" }}>
      <div
        style={{
          opacity: p,
          transform: `translateY(${(1 - p) * 40}px)`,
          background: C.glass,
          border: `1px solid ${C.line}`,
          borderRadius: 30,
          padding: "26px 34px",
          boxShadow: "0 30px 80px -30px rgba(125,26,53,0.8)",
          display: "flex",
          gap: 28,
          alignItems: "flex-start",
        }}
      >
        <span style={{ flexShrink: 0, width: 58, height: 58, borderRadius: "50%", background: C.burgundy, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 600 }}>{s.index}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "baseline" }}>
            <span style={{ fontSize: 34, fontWeight: 600, color: C.gold }}>{s.title.en}</span>
            <span style={{ fontSize: 28, color: C.gold, direction: "rtl", fontFamily: AR_FONT }}>{s.title.ar}</span>
          </div>
          <p style={{ margin: 0, fontSize: 28, lineHeight: 1.35, color: C.ink }}>{s.text.en}</p>
          <p style={{ margin: 0, fontSize: 22, lineHeight: 1.5, color: C.muted, direction: "rtl", fontFamily: AR_FONT }}>{s.text.ar}</p>
          {s.evidence && (
            <p style={{ margin: "6px 0 0", fontSize: 26, color: C.ink }}>
              <Fill text={s.evidence.en} values={values} />
            </p>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function SceneBlock({ s, values }: { s: TimelineScene; values: Record<string, string> }) {
  let at = 0;
  return (
    <Fade>
      <AbsoluteFill style={{ background: C.bg }}>
        {s.segments.map((seg, i) => {
          const len = Math.max(1, Math.round((seg.to - seg.from) / s.rate));
          const start = at;
          at += len;
          return (
            <Sequence key={i} from={start} durationInFrames={len}>
              <OffthreadVideo src={staticFile(s.clip)} startFrom={seg.from} endAt={seg.to} playbackRate={s.rate} muted />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Caption s={s} values={values} />
    </Fade>
  );
}

export function Demo(props: DemoProps) {
  let at = props.titleFrames;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={props.titleFrames}>
        <TitleCard c={props.captions} />
      </Sequence>
      {props.scenes.map((s) => {
        const from = at;
        at += s.frames;
        return (
          <Sequence key={s.key} from={from} durationInFrames={s.frames}>
            <SceneBlock s={s} values={props.captions.placeholders} />
          </Sequence>
        );
      })}
      <Sequence from={at} durationInFrames={props.closingFrames}>
        <ClosingCard c={props.captions} />
      </Sequence>
    </AbsoluteFill>
  );
}
