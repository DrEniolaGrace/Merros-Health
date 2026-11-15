"use client";

import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, VideoScript } from "@/lib/video/script";

/**
 * My Result Video composition (Remotion). Colours are literal brand values, not CSS variables, so
 * the same component can later be rendered on a server (FEATURE_RESULT_VIDEO=render) unchanged.
 */
const C = {
  bg: "#0b0608",
  raised: "#160c10",
  ink: "#f5eef0",
  muted: "#b7a3a9",
  burgundy: "#7d1a35",
  glow: "#c2415f",
  rose: "#f0a6b8",
  gold: "#e2c98f",
  cyan: "#7fd6e0",
  line: "rgba(255,220,230,0.14)",
};

export interface ResultVideoProps extends Record<string, unknown> {
  script: VideoScript;
  locale: "ar" | "en";
  labels: { working: string; changed: string; affected: string; carrier: string; neither: string; brand: string; options: string[] };
}

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
}

function Rise({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const p = useEnter(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 28}px)`, ...style }}>{children}</div>;
}

function Orb({ label, tone, size = 150, delay = 0 }: { label: string; tone: string; size?: number; delay?: number }) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.26, fontWeight: 600, color: tone, opacity: p, transform: `scale(${0.6 + 0.4 * p})`,
        boxShadow: `0 0 0 2px ${tone}, 0 0 ${48 * p}px -6px ${tone}`, background: "radial-gradient(circle at 35% 30%, rgba(255,240,244,0.12), transparent 70%)",
        direction: "ltr",
      }}
    >
      {label}
    </div>
  );
}

function Visual({ scene, labels }: { scene: Scene; labels: ResultVideoProps["labels"] }) {
  const frame = useCurrentFrame();
  const p = useEnter(6);
  switch (scene.kind) {
    case "intro": {
      // Two strands of dots, gently turning: a quiet helix.
      const dots = Array.from({ length: 14 }, (_, i) => i);
      return (
        <div style={{ position: "relative", width: 520, height: 220, opacity: p }}>
          {dots.flatMap((i) =>
            [0, Math.PI].map((phase) => {
              const a = i * 0.55 + frame * 0.03 + phase;
              const depth = (Math.cos(a) + 1) / 2;
              return (
                <span
                  key={`${i}-${phase}`}
                  style={{
                    position: "absolute", left: 20 + i * 36, top: 110 + Math.sin(a) * 78, width: 10 + depth * 10, height: 10 + depth * 10, borderRadius: "50%",
                    background: phase ? C.gold : C.rose, opacity: 0.35 + depth * 0.65, transform: "translate(-50%, -50%)",
                  }}
                />
              );
            }),
          )}
        </div>
      );
    }
    case "carrier":
      return (
        <div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
          {[
            { label: labels.working, tone: C.cyan, delay: 6 },
            { label: labels.changed, tone: C.gold, delay: 22 },
          ].map((c) => (
            <Rise key={c.label} delay={c.delay} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <div style={{ width: 76, height: 230, borderRadius: 38, border: `2px solid ${c.tone}`, boxShadow: `0 0 40px -10px ${c.tone}`, display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", padding: "14px 0" }}>
                {Array.from({ length: 6 }, (_, i) => <span key={i} style={{ width: 40, height: 8, borderRadius: 4, background: c.tone, opacity: c.tone === C.gold && i === 2 ? 1 : 0.4 }} />)}
              </div>
              <span style={{ fontSize: 26, color: C.ink }}>{c.label}</span>
            </Rise>
          ))}
        </div>
      );
    case "result":
      if (scene.result === "carrier") {
        return <div style={{ display: "flex", gap: 36 }}>{scene.genes.slice(0, 4).map((g, i) => <Orb key={g} label={g} tone={C.rose} delay={6 + i * 10} />)}</div>;
      }
      return <Orb label={scene.result === "no_changes" ? "✓" : "?"} tone={scene.result === "no_changes" ? C.cyan : C.gold} size={190} delay={6} />;
    case "chance": {
      const cells = [
        { v: scene.affected, label: labels.affected, tone: C.rose },
        { v: scene.carrier, label: labels.carrier, tone: C.gold },
        { v: scene.neither, label: labels.neither, tone: C.cyan },
      ];
      return (
        <div style={{ display: "flex", gap: 28 }}>
          {cells.map((c, i) => (
            <Rise key={c.label} delay={6 + i * 12} style={{ width: 250, padding: "30px 20px", borderRadius: 28, border: `1.5px solid ${c.tone}`, background: "rgba(255,240,244,0.05)", textAlign: "center" }}>
              <div style={{ fontSize: 74, fontWeight: 600, color: c.tone, direction: "ltr", fontVariantNumeric: "tabular-nums" }}>{c.v}</div>
              <div style={{ fontSize: 24, color: C.ink, marginTop: 8 }}>{c.label}</div>
            </Rise>
          ))}
        </div>
      );
    }
    case "options":
      // All options appear together and the same size: no order, no emphasis.
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 1040, opacity: p, transform: `scale(${0.96 + 0.04 * p})` }}>
          {labels.options.map((o) => (
            <div key={o} style={{ width: 240, minHeight: 92, padding: "14px 16px", borderRadius: 20, border: `1px solid ${C.line}`, background: "rgba(255,240,244,0.06)", color: C.ink, fontSize: 21, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", lineHeight: 1.25 }}>
              {o}
            </div>
          ))}
        </div>
      );
    case "next": {
      const pulse = 1 + Math.sin(frame * 0.08) * 0.04;
      return (
        <div style={{ width: 200, height: 200, borderRadius: "50%", border: `2px solid ${C.gold}`, boxShadow: `0 0 70px -12px ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: p, transform: `scale(${pulse})` }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${C.rose}, ${C.glow} 60%, ${C.burgundy})` }} />
        </div>
      );
    }
  }
}

function SceneView({ scene, locale, labels }: { scene: Scene; locale: "ar" | "en"; labels: ResultVideoProps["labels"] }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 12, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const main = locale === "ar" ? scene.caption.ar : scene.caption.en;
  const other = locale === "ar" ? scene.caption.en : scene.caption.ar;
  return (
    <AbsoluteFill style={{ opacity: fade, padding: "56px 72px 44px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ alignSelf: "flex-start", fontSize: 22, letterSpacing: 2, color: C.gold }}>{labels.brand}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Visual scene={scene} labels={labels} />
      </div>
      {/* Captions in both languages: the person's language first. */}
      <div style={{ width: "100%", borderRadius: 26, background: "rgba(22,12,16,0.82)", border: `1px solid ${C.line}`, padding: "20px 28px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 30, lineHeight: 1.35, color: C.ink, direction: locale === "ar" ? "rtl" : "ltr" }}>{main}</p>
        <p style={{ margin: "10px 0 0", fontSize: 19, lineHeight: 1.4, color: C.muted, direction: locale === "ar" ? "ltr" : "rtl" }}>{other}</p>
      </div>
    </AbsoluteFill>
  );
}

export function ResultVideo({ script, locale, labels }: ResultVideoProps) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 50% 120%, rgba(125,26,53,0.55), ${C.bg} 60%)`, fontFamily: "inherit" }}>
      {script.scenes.map((scene, i) => (
        <Sequence key={i} from={i * script.sceneFrames} durationInFrames={script.sceneFrames}>
          <SceneView scene={scene} locale={locale} labels={labels} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
