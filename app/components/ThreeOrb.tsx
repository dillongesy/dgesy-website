"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── Palette ─────────────────────────────────────────────────────────────────
const PALETTE = [
  new THREE.Color("#818cf8"), // indigo-400
  new THREE.Color("#22d3ee"), // cyan-400
  new THREE.Color("#a78bfa"), // violet-400
  new THREE.Color("#38bdf8"), // sky-400
];

// ─── Fibonacci sphere distribution ───────────────────────────────────────────
function fibonacciSphere(count: number, radius: number) {
  const phi = Math.PI * (Math.sqrt(5) - 1);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;

    positions[i * 3]     = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;

    const c = PALETTE[i % PALETTE.length];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
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
  const groupRef = useRef<THREE.Group>(null!);
  const { mouse } = useThree();

  const POINT_COUNT = 320;
  const RADIUS = 2.4;

  const { positions, colors } = useMemo(
    () => fibonacciSphere(POINT_COUNT, RADIUS),
    []
  );

  const linePositions = useMemo(
    () => buildEdges(positions, 1.35),
    [positions]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.13 + mouse.x * 0.4;
    groupRef.current.rotation.x = t * 0.055 + mouse.y * 0.25;
  });

  return (
    <group ref={groupRef}>
      {/* Particle dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
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
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#818cf8"
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Soft inner glow sphere */}
      <mesh>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh>
        <sphereGeometry args={[2.7, 32, 32]} />
        <meshBasicMaterial
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
