"use client";

/**
 * Living Helix (DESIGN.md section 7.1): a slowly rotating DNA double helix made of burgundy and
 * rose light particles, reacting gently to pointer and scroll. Lazy loaded; see helix-stage.tsx.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(n).trim() || "#c2415f";
  return {
    glow: new THREE.Color(v("--burgundy-glow")),
    rose: new THREE.Color(v("--rose-light")),
    gold: new THREE.Color(v("--pearl-gold")),
    pearl: document.documentElement.dataset.theme === "pearl",
  };
}

function useThemePalette() {
  const [p, setP] = useState(readPalette);
  useEffect(() => {
    const obs = new MutationObserver(() => setP(readPalette()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return p;
}

function softSprite(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Helix({ density }: { density: number }) {
  const group = useRef<THREE.Group>(null);
  const lastScroll = useRef(0);
  const spin = useRef(0.12);
  const pal = useThemePalette();
  const { pointer } = useThree();
  const sprite = useMemo(softSprite, []);

  const { positions, colors, sizes } = useMemo(() => {
    const turns = 3.2;
    const height = 9;
    const radius = 1.35;
    const perStrand = Math.round(420 * density);
    const rungs = Math.round(46 * density);
    const rungPts = 9;
    const total = perStrand * 2 + rungs * rungPts;
    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const size = new Float32Array(total);
    let i = 0;
    const put = (x: number, y: number, z: number, c: THREE.Color, s: number) => {
      pos.set([x, y, z], i * 3);
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = s;
      i++;
    };
    const rand = mulberry32(7);
    for (let strand = 0; strand < 2; strand++) {
      for (let k = 0; k < perStrand; k++) {
        const t = k / perStrand;
        const a = t * turns * Math.PI * 2 + strand * Math.PI;
        const j = 0.06;
        const c = strand === 0 ? pal.glow : pal.rose;
        put(Math.cos(a) * radius + (rand() - 0.5) * j, (t - 0.5) * height + (rand() - 0.5) * j, Math.sin(a) * radius + (rand() - 0.5) * j, c, 0.75 + rand() * 0.5);
      }
    }
    for (let r = 0; r < rungs; r++) {
      const t = (r + 0.5) / rungs;
      const a = t * turns * Math.PI * 2;
      const y = (t - 0.5) * height;
      const gold = r % 11 === 5;
      for (let q = 0; q < rungPts; q++) {
        const u = q / (rungPts - 1) * 2 - 1;
        put(Math.cos(a) * radius * u, y, Math.sin(a) * radius * u, gold ? pal.gold : pal.rose, gold ? 0.9 : 0.45);
      }
    }
    return { positions: pos, colors: col, sizes: size };
  }, [density, pal]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    // Scroll gently speeds the rotation for a moment (never moves the helix out of frame).
    const scroll = typeof window !== "undefined" ? window.scrollY : 0;
    const scrollDelta = Math.min(Math.abs(scroll - lastScroll.current), 60);
    lastScroll.current = scroll;
    spin.current = THREE.MathUtils.lerp(spin.current, 0.12 + scrollDelta * 0.02, 0.05);
    g.rotation.y += delta * spin.current;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.y * 0.18 + 0.35, 0.03);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -pointer.x * 0.12 - 0.35, 0.03);
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.015;
    g.scale.setScalar(breathe);
  });

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, colors, sizes]);

  return (
    <group ref={group}>
      <points geometry={geom}>
        <pointsMaterial
          size={pal.pearl ? 0.15 : 0.11}
          map={sprite}
          vertexColors
          transparent
          depthWrite={false}
          sizeAttenuation
          opacity={pal.pearl ? 0.85 : 1}
          blending={pal.pearl ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function LivingHelix({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [pearl, setPearl] = useState(false);
  const density = typeof window !== "undefined" && window.innerWidth < 640 ? 0.7 : 1;

  useEffect(() => {
    setPearl(document.documentElement.dataset.theme === "pearl");
    const mo = new MutationObserver(() => setPearl(document.documentElement.dataset.theme === "pearl"));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (host.current) io.observe(host.current);
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={host} className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <Helix density={density} />
        {!pearl && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.6} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
