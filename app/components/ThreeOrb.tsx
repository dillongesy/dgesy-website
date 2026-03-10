"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── Palette themes ───────────────────────────────────────────────────────────
const PALETTE_THEMES = [
  [new THREE.Color("#818cf8"), new THREE.Color("#22d3ee"), new THREE.Color("#a78bfa"), new THREE.Color("#38bdf8")],
  [new THREE.Color("#f472b6"), new THREE.Color("#fb7185"), new THREE.Color("#e879f9"), new THREE.Color("#c084fc")],
  [new THREE.Color("#34d399"), new THREE.Color("#4ade80"), new THREE.Color("#22d3ee"), new THREE.Color("#2dd4bf")],
  [new THREE.Color("#fbbf24"), new THREE.Color("#f97316"), new THREE.Color("#fb923c"), new THREE.Color("#facc15")],
];

const THEME_ACCENTS = [
  { line: new THREE.Color("#818cf8"), glow: new THREE.Color("#22d3ee"), atm: new THREE.Color("#818cf8") },
  { line: new THREE.Color("#f472b6"), glow: new THREE.Color("#fb7185"), atm: new THREE.Color("#e879f9") },
  { line: new THREE.Color("#34d399"), glow: new THREE.Color("#22d3ee"), atm: new THREE.Color("#34d399") },
  { line: new THREE.Color("#fbbf24"), glow: new THREE.Color("#f97316"), atm: new THREE.Color("#fbbf24") },
];

const SWITCH_INTERVAL = 5;     // seconds between color changes
const TRANSITION_DURATION = 2; // seconds for lerp

function buildColors(count: number, paletteIndex: number) {
  const palette = PALETTE_THEMES[paletteIndex];
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = palette[i % palette.length];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  return colors;
}

// ─── Fibonacci sphere distribution ───────────────────────────────────────────
function fibonacciSphere(count: number, radius: number, paletteIndex: number) {
  const phi = Math.PI * (Math.sqrt(5) - 1);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;

    positions[i * 3]     = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }

  const colors = buildColors(count, paletteIndex);
  return { positions, colors };
}

// ─── Compute edges between nearby sphere points ───────────────────────────────
function buildEdges(positions: Float32Array, threshold: number) {
  const n = positions.length / 3;
  const lineVerts: number[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = positions[i * 3]     - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < threshold * threshold) {
        lineVerts.push(
          positions[i * 3],     positions[i * 3 + 1], positions[i * 3 + 2],
          positions[j * 3],     positions[j * 3 + 1], positions[j * 3 + 2],
        );
      }
    }
  }
  return new Float32Array(lineVerts);
}

// ─── Inner scene ─────────────────────────────────────────────────────────────
function OrbScene() {
  const groupRef    = useRef<THREE.Group>(null!);
  const pointsRef   = useRef<THREE.Points>(null!);
  const lineMatRef  = useRef<THREE.LineBasicMaterial>(null!);
  const glowMatRef  = useRef<THREE.MeshBasicMaterial>(null!);
  const atmMatRef   = useRef<THREE.MeshBasicMaterial>(null!);
  const { mouse }   = useThree();

  const POINT_COUNT = 320;
  const RADIUS = 1.9;

  const { positions } = useMemo(() => fibonacciSphere(POINT_COUNT, RADIUS, 0), []);

  const linePositions = useMemo(() => buildEdges(positions, 1.1), [positions]);

  // Mutable color state (refs, never triggers re-render)
  const colorState = useRef({
    themeIndex:  0,
    nextIndex:   1,
    fromColors:  buildColors(POINT_COUNT, 0),
    toColors:    buildColors(POINT_COUNT, 1),
    workColors:  buildColors(POINT_COUNT, 0).slice() as Float32Array,
    progress:    1,   // start at 1 = no transition running
    timer:       SWITCH_INTERVAL,
    fromLine:    THEME_ACCENTS[0].line.clone(),
    fromGlow:    THEME_ACCENTS[0].glow.clone(),
    fromAtm:     THEME_ACCENTS[0].atm.clone(),
  });

  const initialColors = useMemo(() => buildColors(POINT_COUNT, 0), []);

  useFrame((state, delta) => {
    const t  = state.clock.elapsedTime;
    const cs = colorState.current;

    // Rotate orb
    groupRef.current.rotation.y = t * 0.13 + mouse.x * 0.4;
    groupRef.current.rotation.x = t * 0.055 + mouse.y * 0.25;

    // Count down until next switch
    if (cs.progress >= 1) {
      cs.timer -= delta;
      if (cs.timer <= 0) {
        // Snapshot current colors as the new "from"
        cs.fromColors.set(cs.workColors);
        cs.fromLine.copy(lineMatRef.current.color);
        cs.fromGlow.copy(glowMatRef.current.color);
        cs.fromAtm.copy(atmMatRef.current.color);

        // Pick a new random different theme
        let next = Math.floor(Math.random() * PALETTE_THEMES.length);
        if (next === cs.themeIndex) next = (next + 1) % PALETTE_THEMES.length;
        cs.themeIndex = next;
        cs.toColors = buildColors(POINT_COUNT, next);

        cs.progress = 0;
        cs.timer = SWITCH_INTERVAL;
      }
    }

    // Animate transition
    if (cs.progress < 1) {
      cs.progress = Math.min(1, cs.progress + delta / TRANSITION_DURATION);
      const p = cs.progress;

      // Update vertex colors
      const attr = (pointsRef.current.geometry as THREE.BufferGeometry)
        .getAttribute("color") as THREE.BufferAttribute;
      for (let i = 0; i < POINT_COUNT * 3; i++) {
        cs.workColors[i] = cs.fromColors[i] + (cs.toColors[i] - cs.fromColors[i]) * p;
      }
      attr.array = cs.workColors;
      attr.needsUpdate = true;

      // Update accent materials
      const accent = THEME_ACCENTS[cs.themeIndex];
      lineMatRef.current.color.lerpColors(cs.fromLine, accent.line, p);
      glowMatRef.current.color.lerpColors(cs.fromGlow, accent.glow, p);
      atmMatRef.current.color.lerpColors(cs.fromAtm, accent.atm, p);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Particle dots */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[initialColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          vertexColors
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Connecting lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMatRef}
          color="#818cf8"
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Soft inner glow sphere */}
      <mesh>
        <sphereGeometry args={[0.87, 32, 32]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color="#22d3ee"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh>
        <sphereGeometry args={[2.15, 32, 32]} />
        <meshBasicMaterial
          ref={atmMatRef}
          color="#818cf8"
          transparent
          opacity={0.02}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Exported canvas wrapper ──────────────────────────────────────────────────
export default function ThreeOrb() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 45 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <OrbScene />
    </Canvas>
  );
}
