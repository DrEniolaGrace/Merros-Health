import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { SCREEN, cameraAt, sourceMs, type CameraKey } from "../timeline";

const sora = loadSora();
const FONT = `${sora.fontFamily}, sans-serif`;

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
  glass: "rgba(22,12,16,0.86)",
};

/** The app is shown in this window; the caption bar sits underneath it, never on top. */
const APP = { x: 176, y: 34, w: 1568, h: 882 };
const BAR = { x: APP.x, y: APP.y + APP.h + 22, w: APP.w, h: 96 };

export interface TimelineScene {
  key: string;
  clip: string;
  /** 1 to 4 for the story; 0 for a montage shot. */
  index: number;
  caption: string;
  evidence?: string;
  intro?: { eyebrow: string; heading: string };
  introFrames: number;
  /** Kept parts of the clip, in source frames, played at `rate`. */
  segments: { from: number; to: number }[];
  rate: number;
  /** Frames of footage (the intro card comes on top of this). */
  frames: number;
  camera: CameraKey[];
}

export interface DemoProps extends Record<string, unknown> {
  fps: number;
  titleFrames: number;
  closingFrames: number;
  scenes: TimelineScene[];
  captions: {
    title: { eyebrow: string; heading: string; body: string };
    montage: string;
    closing: { heading: string; evidence: string; link: string; note: string };
  };
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

function Fade({ children, edge = 14 }: { children: React.ReactNode; edge?: number }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, edge, durationInFrames - edge, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-block", padding: "10px 22px", borderRadius: 999, border: `1.5px solid ${C.gold}`, color: C.gold, fontSize: 24, letterSpacing: 3, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function Mark({ size }: { size: number }) {
  return <Img src={staticFile("brand/merros-mark.png")} style={{ width: size, height: size, borderRadius: size * 0.28, boxShadow: `0 0 60px -10px ${C.glow}` }} />;
}

function TitleCard({ c }: { c: DemoProps["captions"] }) {
  return (
    <Fade>
      <Backdrop />
      <AbsoluteFill style={{ padding: "0 200px", justifyContent: "center", gap: 36, fontFamily: FONT }}>
        <Rise style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <Mark size={84} />
          <Eyebrow>{c.title.eyebrow}</Eyebrow>
        </Rise>
        <Rise delay={8}>
          <h1 style={{ margin: 0, fontSize: 78, lineHeight: 1.08, fontWeight: 600, color: C.ink, maxWidth: 1450 }}>{c.title.heading}</h1>
        </Rise>
        <Rise delay={16}>
          <p style={{ margin: 0, fontSize: 38, lineHeight: 1.4, color: C.muted, maxWidth: 1300 }}>{c.title.body}</p>
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
          <Mark size={150} />
        </Rise>
        <Rise delay={6}>
          <h1 style={{ margin: 0, fontSize: 84, fontWeight: 600, color: C.ink }}>{c.closing.heading}</h1>
        </Rise>
        <Rise delay={14}>
          <p style={{ margin: 0, fontSize: 42, color: C.gold, fontWeight: 600 }}>{c.closing.evidence}</p>
        </Rise>
        <Rise delay={22}>
          <p style={{ margin: 0, fontSize: 40, color: C.ink, letterSpacing: 1 }}>{c.closing.link}</p>
        </Rise>
        <Rise delay={30}>
          <p style={{ margin: 0, fontSize: 24, color: C.muted, maxWidth: 1300 }}>{c.closing.note}</p>
        </Rise>
      </AbsoluteFill>
    </Fade>
  );
}

/** "One year later": a short card before the footage of a scene. */
function IntroCard({ intro }: { intro: NonNullable<TimelineScene["intro"]> }) {
  return (
    <Fade edge={10}>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30, textAlign: "center", fontFamily: FONT }}>
        <Rise><Eyebrow>{intro.eyebrow}</Eyebrow></Rise>
        <Rise delay={6}><h1 style={{ margin: 0, fontSize: 72, fontWeight: 600, color: C.ink }}>{intro.heading}</h1></Rise>
      </AbsoluteFill>
    </Fade>
  );
}

/** A small bar under the app window: scene number, one short line, and any testing result. */
function CaptionBar({ s, montage }: { s: TimelineScene; montage: string }) {
  const p = useRise(6);
  return (
    <div
      style={{
        position: "absolute",
        left: BAR.x,
        top: BAR.y,
        width: BAR.w,
        height: BAR.h,
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
        background: C.glass,
        border: `1px solid ${C.line}`,
        borderRadius: 24,
        padding: "0 26px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        fontFamily: FONT,
        boxSizing: "border-box",
      }}
    >
      {s.index > 0 ? (
        <span style={{ flexShrink: 0, width: 50, height: 50, borderRadius: "50%", background: C.burgundy, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600 }}>{s.index}</span>
      ) : (
        <span style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, background: C.burgundy, color: C.ink, fontSize: 20, fontWeight: 600, letterSpacing: 1 }}>{montage}</span>
      )}
      <span style={{ flex: 1, minWidth: 0, fontSize: 32, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.caption}</span>
      {s.evidence && (
        <span style={{ flexShrink: 0, maxWidth: 640, padding: "10px 18px", borderRadius: 16, border: `1.5px solid ${C.gold}`, color: C.gold, fontSize: 22, lineHeight: 1.25, fontWeight: 600 }}>{s.evidence}</span>
      )}
    </div>
  );
}

/** The recorded app, in its window, with the camera zooming in on what matters. */
function AppWindow({ s }: { s: TimelineScene }) {
  const frame = useCurrentFrame();
  const view = cameraAt(s.camera, sourceMs(s.segments, s.rate, frame));
  const fit = APP.w / SCREEN.w;
  let at = 0;
  return (
    <div style={{ position: "absolute", left: APP.x, top: APP.y, width: APP.w, height: APP.h, overflow: "hidden", borderRadius: 22, border: `1px solid ${C.line}`, boxShadow: "0 40px 90px -40px rgba(125,26,53,0.9)", background: C.bg }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SCREEN.w,
          height: SCREEN.h,
          transformOrigin: "0 0",
          transform: `scale(${fit}) translate(${SCREEN.w / 2 - view.cx * view.scale}px, ${SCREEN.h / 2 - view.cy * view.scale}px) scale(${view.scale})`,
        }}
      >
        {s.segments.map((seg, i) => {
          const len = Math.max(1, Math.round((seg.to - seg.from) / s.rate));
          const start = at;
          at += len;
          return (
            <Sequence key={i} from={start} durationInFrames={len}>
              <OffthreadVideo src={staticFile(s.clip)} startFrom={seg.from} endAt={seg.to} playbackRate={s.rate} muted style={{ width: SCREEN.w, height: SCREEN.h }} />
            </Sequence>
          );
        })}
      </div>
    </div>
  );
}

function SceneBlock({ s, montage }: { s: TimelineScene; montage: string }) {
  return (
    <AbsoluteFill>
      {s.intro && s.introFrames > 0 && (
        <Sequence durationInFrames={s.introFrames}>
          <IntroCard intro={s.intro} />
        </Sequence>
      )}
      <Sequence from={s.introFrames} durationInFrames={s.frames}>
        <Fade edge={s.index > 0 ? 12 : 6}>
          <Backdrop />
          <AppWindow s={s} />
          <CaptionBar s={s} montage={montage} />
        </Fade>
      </Sequence>
    </AbsoluteFill>
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
        at += s.introFrames + s.frames;
        return (
          <Sequence key={s.key} from={from} durationInFrames={s.introFrames + s.frames}>
            <SceneBlock s={s} montage={props.captions.montage} />
          </Sequence>
        );
      })}
      <Sequence from={at} durationInFrames={props.closingFrames}>
        <ClosingCard c={props.captions} />
      </Sequence>
    </AbsoluteFill>
  );
}
