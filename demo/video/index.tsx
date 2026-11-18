import React from "react";
import { Composition, registerRoot } from "remotion";
import { Demo, Patch, type DemoProps, type PatchProps } from "./composition";

/** Remotion entry for the demo video. The timeline arrives as input props from demo/render.ts. */
function Root() {
  return (
    <Composition
      id="Demo"
      component={Demo as unknown as React.ComponentType<Record<string, unknown>>}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={30}
      defaultProps={{} as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const p = props as unknown as DemoProps;
        return { durationInFrames: p.titleFrames + p.closingFrames + p.scenes.reduce((n, s) => n + s.introFrames + s.frames, 0), fps: p.fps };
      }}
    />
  );
}

/** One replacement piece of the video (demo/patch.ts). */
function PatchRoot() {
  return (
    <Composition
      id="Patch"
      component={Patch as unknown as React.ComponentType<Record<string, unknown>>}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={30}
      defaultProps={{} as Record<string, unknown>}
      calculateMetadata={({ props }) => ({ durationInFrames: (props as unknown as PatchProps).scene.frames, fps: 30 })}
    />
  );
}

function All() {
  return (
    <>
      <Root />
      <PatchRoot />
    </>
  );
}

registerRoot(All);
