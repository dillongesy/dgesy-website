"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const GROW_MS = 4200;
const HOLD_MS = 1300;
const ERASE_MS = 2600;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const normAng = (a: number) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

type Vine = {
  waypoints: [number, number][]; // world coords (x ∈ [-aspect,aspect], y ∈ [-1,1])
  leafLen: number;
  leafGapFactor: number;
  sideStart: number;
};

type Geometry = {
  gen: number;
  pPos: Float32Array;
  pRev: Float32Array;
  lPos: Float32Array;
  lRev: Float32Array;
};

// ── Generate a random vine in world space ───────────────────────────────────
function randomVine(aspect: number): Vine {
  const bx = aspect * 0.94;
  const by = 0.94;
  const border = Math.floor(rand(0, 4)); // 0 top, 1 right, 2 bottom, 3 left
  const spread = rand(-0.5, 0.5);
  let x: number, y: number, ang: number;
  if (border === 0) {
    x = rand(-bx * 0.85, bx * 0.85); y = by; ang = -Math.PI / 2 + spread; // top → down
  } else if (border === 1) {
    x = bx; y = rand(-by * 0.85, by * 0.85); ang = Math.PI + spread; // right → left
  } else if (border === 2) {
    x = rand(-bx * 0.85, bx * 0.85); y = -by; ang = Math.PI / 2 + spread; // bottom → up
  } else {
    x = -bx; y = rand(-by * 0.85, by * 0.85); ang = 0 + spread; // left → right
  }

  const baseStep = rand(0.18, 0.3);
  const tX = rand(-0.2, 0.2) * aspect;
  const tY = rand(-0.2, 0.2);
  let reached = false;

  const waypoints: [number, number][] = [[x, y]];
  for (let i = 0; i < 80; i++) {
    if (!reached) {
      const desired = Math.atan2(tY - y, tX - x);
      ang += clamp(normAng(desired - ang), -0.3, 0.3) + rand(-0.22, 0.22);
      if (Math.hypot(x, y) < 0.3) reached = true;
    } else {
      ang += rand(-0.32, 0.32);
    }
    const step = baseStep * rand(0.85, 1.15);
    const nx = x + Math.cos(ang) * step;
    const ny = y + Math.sin(ang) * step;
    if (nx < -bx || nx > bx || ny < -by || ny > by) {
      if (waypoints.length < 2) {
        waypoints.push([clamp(nx, -bx, bx), clamp(ny, -by, by)]);
      }
      break;
    }
    x = nx;
    y = ny;
    waypoints.push([x, y]);
  }

  return {
    waypoints,
    leafLen: rand(0.15, 0.24),
    leafGapFactor: rand(0.7, 0.95),
    sideStart: Math.random() < 0.5 ? 1 : -1,
  };
}

function catmullRom(
  p0: number, p1: number, p2: number, p3: number, t: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

// ── Turn a vine into point + line buffers ───────────────────────────────────
function genGeometry(vine: Vine, gen: number): Geometry {
  const pPos: number[] = [];
  const pRev: number[] = [];
  const lPos: number[] = [];
  const lRev: number[] = [];
  const addP = (x: number, y: number, z: number, r: number) => {
    pPos.push(x, y, z);
    pRev.push(r);
  };
  const addSeg = (
    x1: number, y1: number, z1: number, r1: number,
    x2: number, y2: number, z2: number, r2: number,
  ) => {
    lPos.push(x1, y1, z1, x2, y2, z2);
    lRev.push(r1, r2);
  };

  const pts = vine.waypoints;
  const N = 360;
  const path: { x: number; y: number; ang: number }[] = [];
  for (let s = 0; s < N; s++) {
    const u = (s / (N - 1)) * (pts.length - 1);
    const i = Math.min(Math.floor(u), pts.length - 2);
    const lt = u - i;
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    path.push({
      x: catmullRom(p0[0], p1[0], p2[0], p3[0], lt),
      y: catmullRom(p0[1], p1[1], p2[1], p3[1], lt),
      ang: 0,
    });
  }
  for (let s = 0; s < N; s++) {
    const a = path[Math.max(0, s - 1)];
    const b = path[Math.min(N - 1, s + 1)];
    path[s].ang = Math.atan2(b.y - a.y, b.x - a.x);
  }

  const arc = new Array<number>(N);
  arc[0] = 0;
  for (let s = 1; s < N; s++) {
    arc[s] = arc[s - 1] + Math.hypot(path[s].x - path[s - 1].x, path[s].y - path[s - 1].y);
  }
  const total = arc[N - 1];

  // Stem: line through every sample, points every few samples.
  for (let s = 0; s < N; s++) {
    const r = s / (N - 1);
    if (s % 4 === 0) addP(path[s].x, path[s].y, 0, r);
    if (s > 0) {
      addSeg(path[s - 1].x, path[s - 1].y, 0, (s - 1) / (N - 1), path[s].x, path[s].y, 0, r);
    }
  }

  // Leaves: arc-length spaced, alternating sides. Each is an almond outline with
  // a central midrib and angled lateral veins (herringbone), folded along the
  // midrib (midrib raised, edges lower) so it reads as a real 3D leaf.
  const gap = Math.max(0.05, vine.leafLen * vine.leafGapFactor);
  let side = vine.sideStart;
  let si = 1;
  let leafIdx = 0;
  type V4 = [number, number, number, number]; // x, y, z, reveal
  for (let target = gap * 0.7; target < total - vine.leafLen * 0.3; target += gap) {
    while (si < N - 1 && arc[si] < target) si++;
    const base = path[si];
    const baseRev = si / (N - 1);
    const ang = base.ang - side * (Math.PI / 3); // ~60° off the stem, alternating
    const ax = Math.cos(ang);
    const ay = Math.sin(ang);
    const px = -ay;
    const py = ax;

    // Per-leaf length variation via a stable hash of the index (deterministic,
    // so a resize regenerates the same leaves rather than reshuffling them).
    const hashed = Math.sin(leafIdx * 12.9898) * 43758.5453;
    const lenFactor = 0.7 + (hashed - Math.floor(hashed)) * 0.6; // 0.7..1.3
    const length = vine.leafLen * lenFactor;
    const maxHalf = length * 0.32;
    const bulge = 0.055;
    const STEPS = 16;

    // Sample the midrib (C) and the two outline edges (L, R).
    const C: V4[] = [];
    const Ledge: V4[] = [];
    const Redge: V4[] = [];
    for (let k = 0; k <= STEPS; k++) {
      const v = k / STEPS;
      const along = v * length;
      // Ovate leaf: widest ~36% up from the base, pointed tip, tapered base.
      // w(v) = v^0.5 · (1-v)^0.9, normalized so its peak (≈0.401) maps to maxHalf.
      const half = ((Math.pow(v, 0.5) * Math.pow(1 - v, 0.9)) / 0.401) * maxHalf;
      const zc = Math.sin(Math.PI * v) * bulge; // midrib ridge (toward camera)
      const ze = zc * 0.4; // edges sit lower → folded V cross-section
      const cx = base.x + ax * along;
      const cy = base.y + ay * along;
      const rev = Math.min(1, baseRev + v * 0.05);
      C.push([cx, cy, zc, rev]);
      Ledge.push([cx + px * half, cy + py * half, ze, rev]);
      Redge.push([cx - px * half, cy - py * half, ze, rev]);
    }

    // Dots along the edges + midrib.
    for (let k = 0; k <= STEPS; k++) {
      if (k % 2 === 0) {
        addP(Ledge[k][0], Ledge[k][1], Ledge[k][2], Ledge[k][3]);
        addP(Redge[k][0], Redge[k][1], Redge[k][2], Redge[k][3]);
      }
      if (k % 4 === 0) addP(C[k][0], C[k][1], C[k][2], C[k][3]);
    }

    // Outline edges + midrib (the outline auto-closes since half→0 at base/tip).
    for (let k = 0; k < STEPS; k++) {
      addSeg(Ledge[k][0], Ledge[k][1], Ledge[k][2], Ledge[k][3], Ledge[k + 1][0], Ledge[k + 1][1], Ledge[k + 1][2], Ledge[k + 1][3]);
      addSeg(Redge[k][0], Redge[k][1], Redge[k][2], Redge[k][3], Redge[k + 1][0], Redge[k + 1][1], Redge[k + 1][2], Redge[k + 1][3]);
      addSeg(C[k][0], C[k][1], C[k][2], C[k][3], C[k + 1][0], C[k + 1][1], C[k + 1][2], C[k + 1][3]);
    }

    // Lateral veins: midrib → a more tip-ward edge point, so they angle forward.
    for (let k = 2; k <= STEPS - 3; k += 3) {
      const t = Math.min(STEPS, k + 2);
      addSeg(C[k][0], C[k][1], C[k][2], C[k][3], Ledge[t][0], Ledge[t][1], Ledge[t][2], Ledge[t][3]);
      addSeg(C[k][0], C[k][1], C[k][2], C[k][3], Redge[t][0], Redge[t][1], Redge[t][2], Redge[t][3]);
    }

    side *= -1;
    leafIdx++;
  }

  return {
    gen,
    pPos: Float32Array.from(pPos),
    pRev: Float32Array.from(pRev),
    lPos: Float32Array.from(lPos),
    lRev: Float32Array.from(lRev),
  };
}

// ── Shaders ─────────────────────────────────────────────────────────────────
const vertexShader = `
  attribute float aReveal;
  varying float vReveal;
  uniform float uPointSize;
  void main() {
    vReveal = aReveal;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragCommon = `
  precision mediump float;
  varying float vReveal;
  uniform float uProgress;
  uniform float uErase;
  uniform float uTime;
  uniform float uBaseAlpha;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  float computeAlpha() {
    float aGrow = 1.0 - smoothstep(uProgress - 0.05, uProgress, vReveal);
    float aErase = smoothstep(uErase, uErase + 0.05, vReveal);
    return aGrow * aErase;
  }
  vec3 computeColor() {
    float glow = 0.5 + 0.5 * sin(uTime * 1.6 - vReveal * 14.0);
    vec3 col = mix(uColorA, uColorB, glow);
    float frontier = smoothstep(0.05, 0.0, abs(vReveal - uProgress)) * (1.0 - step(0.999, uProgress));
    col += vec3(0.5, 0.85, 0.6) * frontier;
    return col;
  }
`;

const fragLine = fragCommon + `
  void main() {
    float alpha = computeAlpha();
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(computeColor(), alpha * uBaseAlpha);
  }
`;

const fragPoint = fragCommon + `
  void main() {
    float alpha = computeAlpha();
    if (alpha <= 0.001) discard;
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(computeColor(), alpha * uBaseAlpha * soft);
  }
`;

type Phase = "grow" | "hold" | "erase";

function Lane({
  delay,
  reduced,
  loop,
}: {
  delay: number;
  reduced: boolean;
  loop: boolean;
}) {
  const { size } = useThree();
  const aspect = size.height > 0 ? size.width / size.height : 1;

  const [geo, setGeo] = useState<Geometry | null>(null);
  const genRef = useRef(0);
  const phaseRef = useRef<{ phase: Phase; start: number }>({
    phase: "grow",
    start: performance.now() + delay,
  });

  const uniforms = useMemo(
    () => ({
      uProgress: { value: reduced ? 1 : 0 },
      uErase: { value: 0 },
      uTime: { value: 0 },
      uPointSize: { value: 3.0 },
      uColorA: { value: new THREE.Color(0.04, 0.5, 0.34) },
      uColorB: { value: new THREE.Color(0.18, 0.95, 0.6) },
    }),
    [reduced],
  );

  const pointMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { ...uniforms, uBaseAlpha: { value: 1.0 } },
        vertexShader,
        fragmentShader: fragPoint,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    [uniforms],
  );
  const lineMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { ...uniforms, uBaseAlpha: { value: 0.5 } },
        vertexShader,
        fragmentShader: fragLine,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    [uniforms],
  );

  // (Re)generate when the viewport aspect changes (and on first valid size).
  useEffect(() => {
    if (!size.width || !size.height) return;
    genRef.current += 1;
    setGeo(genGeometry(randomVine(aspect), genRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  useFrame((state) => {
    if (reduced) {
      uniforms.uProgress.value = 1;
      uniforms.uErase.value = 0;
      return;
    }
    uniforms.uTime.value = state.clock.elapsedTime;

    const now = performance.now();
    const ph = phaseRef.current;
    let guard = 0;
    while (guard++ < 6) {
      const d = ph.phase === "grow" ? GROW_MS : ph.phase === "hold" ? HOLD_MS : ERASE_MS;
      if (now - ph.start < d) break;
      if (ph.phase === "hold" && !loop) break; // static: grow once, then stay
      ph.start += d;
      if (ph.phase === "grow") ph.phase = "hold";
      else if (ph.phase === "hold") ph.phase = "erase";
      else {
        genRef.current += 1;
        setGeo(genGeometry(randomVine(aspect), genRef.current));
        ph.phase = "grow";
      }
    }

    const elapsed = now - ph.start;
    if (elapsed < 0) {
      uniforms.uProgress.value = 0;
      uniforms.uErase.value = 0;
      return;
    }
    if (ph.phase === "grow") {
      uniforms.uProgress.value = easeOut(Math.min(1, elapsed / GROW_MS));
      uniforms.uErase.value = 0;
    } else if (ph.phase === "hold") {
      uniforms.uProgress.value = 1;
      uniforms.uErase.value = 0;
    } else {
      uniforms.uProgress.value = 1;
      uniforms.uErase.value = Math.min(1, elapsed / ERASE_MS);
    }
  });

  if (!geo) return null;

  return (
    <group>
      <points key={`p${geo.gen}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geo.pPos, 3]} />
          <bufferAttribute attach="attributes-aReveal" args={[geo.pRev, 1]} />
        </bufferGeometry>
        <primitive object={pointMat} attach="material" />
      </points>
      <lineSegments key={`l${geo.gen}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geo.lPos, 3]} />
          <bufferAttribute attach="attributes-aReveal" args={[geo.lRev, 1]} />
        </bufferGeometry>
        <primitive object={lineMat} attach="material" />
      </lineSegments>
    </group>
  );
}

function Scene({
  reduced,
  loop,
  laneCount,
}: {
  reduced: boolean;
  loop: boolean;
  laneCount: number;
}) {
  const group = useRef<THREE.Group>(null!);
  useFrame((state) => {
    if (reduced || !group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.18) * 0.08;
    group.current.rotation.x = Math.sin(t * 0.13) * 0.05;
  });
  return (
    <group ref={group}>
      {Array.from({ length: laneCount }).map((_, i) => (
        <Lane key={i} delay={i * 2600} reduced={reduced} loop={loop} />
      ))}
    </group>
  );
}

export default function LeafGrowth3D({
  loop = true,
  laneCount = 2,
  opacity = 1,
}: {
  loop?: boolean;
  laneCount?: number;
  opacity?: number;
}) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" style={{ opacity }}>
      <Canvas
        camera={{ position: [0, 0, 2.414], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Scene reduced={reduced} loop={loop} laneCount={laneCount} />
      </Canvas>
    </div>
  );
}
