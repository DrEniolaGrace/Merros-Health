import React from "react";
import { Composition, registerRoot } from "remotion";
import { Demo, type DemoProps } from "./composition";

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

registerRoot(Root);
