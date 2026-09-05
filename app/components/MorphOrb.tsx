"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  N,
  N3,
  SHAPES,
  HOLD_SECONDS,
  MODE_SECONDS,
  BOX_R,
  CAMERA_Z,
  CANVAS_SCALE,
  easeInOut,
  mulberry32,
  C,
  type MorphMode,
} from "./orbShapes";

const _c = new THREE.Color(); // local scratch for building comet trail colours

// ── comets ──────────────────────────────────────────────────────────────────
const COMETS = 18;
const TRAIL = 16;
const COMET_PTS = COMETS * TRAIL;

function CometSwarm() {
  const trailRef = useRef<THREE.Points>(null!);
  const headRef = useRef<THREE.Points>(null!);

  const data = useMemo(() => {
    const rnd = mulberry32(2024);
    const orbits = Array.from({ length: COMETS }, () => ({
      a: 2.5 + rnd() * 0.95,
      b: 2.3 + rnd() * 1.0,
      speed: (0.25 + rnd() * 0.55) * (rnd() < 0.5 ? -1 : 1),
      phase: rnd() * Math.PI * 2,
      q: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI),
      ),
      warm: rnd() < 0.5,
    }));

    const tPos = new Float32Array(COMET_PTS * 3);
    const tCol = new Float32Array(COMET_PTS * 3);
    const hPos = new Float32Array(COMETS * 3);
    const head = new THREE.Color("#e0f2fe");

    // the trail fades to black, which additive blending renders as fading out
    for (let ci = 0; ci < COMETS; ci++) {
      for (let k = 0; k < TRAIL; k++) {
        const i = ci * TRAIL + k;
        const f = 1 - k / TRAIL;
        _c.copy(head)
          .lerp(orbits[ci].warm ? C.purple : C.cyan, 1 - f)
          .multiplyScalar(Math.pow(f, 1.7));
        tCol[i * 3] = _c.r;
        tCol[i * 3 + 1] = _c.g;
        tCol[i * 3 + 2] = _c.b;
      }
    }
    return { orbits, tPos, tCol, hPos };
  }, []);

  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { orbits, tPos, hPos } = data;
    for (let ci = 0; ci < COMETS; ci++) {
      const o = orbits[ci];
      for (let k = 0; k < TRAIL; k++) {
        const th = o.phase + (t - k * 0.03) * o.speed;
        v.set(Math.cos(th) * o.a, Math.sin(th) * o.b, Math.sin(th * 2) * 0.4).applyQuaternion(o.q);
        const i = ci * TRAIL + k;
        tPos[i * 3] = v.x;
        tPos[i * 3 + 1] = v.y;
        tPos[i * 3 + 2] = v.z;
        if (k === 0) {
          hPos[ci * 3] = v.x;
          hPos[ci * 3 + 1] = v.y;
          hPos[ci * 3 + 2] = v.z;
        }
      }
    }
    (trailRef.current.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (headRef.current.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <group>
      <points ref={trailRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.tPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.tCol, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.033}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points ref={headRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.hPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.095}
          color="#f0f9ff"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// ── the morphing body ───────────────────────────────────────────────────────
type Ptr = { x: number; y: number; over: boolean };

function MorphBody({
  index,
  mode,
  ptr,
  onIdle,
}: {
  index: number;
  mode: React.RefObject<MorphMode>;
  ptr: React.RefObject<Ptr>;
  onIdle: () => void;
}) {
  const built = useMemo(() => SHAPES.map((s) => s.build()), []);

  const buffers = useMemo(() => {
    // points and lines share one position attribute, so a single write moves
    // both — and both read the same vertex colours, so anything faded to black
    // takes its wireframe with it
    const posAttr = new THREE.BufferAttribute(built[0].pos.slice(), 3);
    const colAttr = new THREE.BufferAttribute(built[0].col.slice(), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr.setUsage(THREE.DynamicDrawUsage);

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", posAttr);
    pointsGeo.setAttribute("color", colAttr);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", posAttr);
    lineGeo.setAttribute("color", colAttr);
    lineGeo.setIndex(new THREE.BufferAttribute(built[0].edges, 1));

    const hash = new Float32Array(N);
    const burst = new Float32Array(N3); // per-point shatter direction
    const rnd = mulberry32(1337);
    for (let i = 0; i < N; i++) {
      hash[i] = rnd();
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      burst[i * 3] = Math.sin(ph) * Math.cos(th);
      burst[i * 3 + 1] = Math.cos(ph);
      burst[i * 3 + 2] = Math.sin(ph) * Math.sin(th);
    }

    return {
      posAttr,
      colAttr,
      pointsGeo,
      lineGeo,
      hash,
      burst,
      from: built[0].pos.slice(),
      fromCol: built[0].col.slice(),
      target: new Float32Array(N3),
      targetCol: built[0].col.slice(),
      push: new Float32Array(N3), // smoothed cursor repulsion
    };
  }, [built]);

  const st = useRef({
    to: 0,
    p: 1,
    hold: HOLD_SECONDS,
    pending: false,
    shown: 0,
    rx: 0,
    ry: 0,
    mode: "vortex" as MorphMode,
  });
  const groupRef = useRef<THREE.Group>(null!);
  const lineMat = useRef<THREE.LineBasicMaterial>(null!);
  const fromAccent = useMemo(() => new THREE.Color(SHAPES[0].accent), []);
  const accent = useMemo(() => new THREE.Color(), []);
  const repel = useMemo(() => new THREE.Vector3(), []);
  const invQ = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const s = st.current;
    const { posAttr, colAttr, lineGeo, hash, burst, from, fromCol, target, targetCol, push } =
      buffers;
    const disp = posAttr.array as Float32Array;
    const dcol = colAttr.array as Float32Array;

    // a new shape was requested → snapshot what is on screen and start morphing.
    // The cursor push is subtracted out so it is not baked in and re-applied.
    if (index !== s.to) {
      for (let i = 0; i < N3; i++) from[i] = disp[i] - push[i];
      fromCol.set(dcol);
      fromAccent.copy(lineMat.current.color);
      s.to = index;
      s.p = 0;
      s.pending = false;
      s.hold = HOLD_SECONDS;
      s.mode = mode.current ?? "vortex";
    }

    const shape = SHAPES[s.to];
    const b = built[s.to];

    if (shape.live) shape.live(target, b, t, dt);
    else target.set(b.pos);
    if (shape.liveCol) shape.liveCol(targetCol, b, t);
    else targetCol.set(b.col);

    let bright = 1;
    const morphing = s.p < 1;

    if (morphing) {
      s.p = Math.min(1, s.p + dt / MODE_SECONDS[s.mode]);
      const e = easeInOut(s.p);
      const arc = Math.sin(Math.PI * s.p);

      for (let i = 0; i < N; i++) {
        const h = hash[i];
        let x = from[i * 3] + (target[i * 3] - from[i * 3]) * e;
        let y = from[i * 3 + 1] + (target[i * 3 + 1] - from[i * 3 + 1]) * e;
        let z = from[i * 3 + 2] + (target[i * 3 + 2] - from[i * 3 + 2]) * e;

        if (s.mode === "vortex") {
          // every point spins around the axis and puffs outward as it crosses,
          // so the shape turns itself inside out mid-flight
          const ang = arc * (0.8 + h * 1.7);
          const ca = Math.cos(ang);
          const sa = Math.sin(ang);
          const k = 1 + arc * 0.2 * (h - 0.4);
          const nx = (x * ca - z * sa) * k;
          const nz = (x * sa + z * ca) * k;
          x = nx;
          z = nz;
          y = y * k + arc * 0.35 * (h - 0.5);
        } else if (s.mode === "nova") {
          // every point rides out to its own shell radius and falls back in.
          // The shell reaches well past the layout box on purpose — the canvas
          // is oversized, so the blast crosses the page instead of hitting an edge.
          const r = Math.hypot(x, y, z) || 1;
          const shell = 2.2 + h * 3.4;
          const k = (r + (shell - r) * Math.pow(arc, 0.7)) / r;
          x *= k;
          y *= k;
          z *= k;
        } else {
          // shatter: each point flies off to its own scattered position
          const w = Math.pow(arc, 0.5);
          const reach = 1.9 + h * 3.6;
          x += (burst[i * 3] * reach - x) * w;
          y += (burst[i * 3 + 1] * reach - y) * w;
          z += (burst[i * 3 + 2] * reach - z) * w;
        }

        disp[i * 3] = x;
        disp[i * 3 + 1] = y;
        disp[i * 3 + 2] = z;
      }

      for (let i = 0; i < N3; i++) dcol[i] = fromCol[i] + (targetCol[i] - fromCol[i]) * e;
      if (s.mode !== "vortex") bright = 1 + arc * 1.1;

      accent.set(shape.accent);
      lineMat.current.color.lerpColors(fromAccent, accent, e);
      lineMat.current.opacity = 0.3 * (1 - 0.85 * arc);

      // swap the wireframe topology while the lines are at their dimmest
      if (s.p >= 0.5 && s.shown !== s.to) {
        lineGeo.setIndex(new THREE.BufferAttribute(b.edges, 1));
        s.shown = s.to;
      }
    } else {
      disp.set(target);
      if (shape.liveCol) dcol.set(targetCol);
      lineMat.current.opacity = 0.3;
      if (!s.pending) {
        s.hold -= dt;
        if (s.hold <= 0) {
          s.pending = true;
          onIdle();
        }
      }
    }

    // ── cursor repulsion, in the group's own frame so it survives rotation ──
    const p = ptr.current;
    invQ.copy(groupRef.current.quaternion).invert();
    repel.set(p.x * BOX_R, p.y * BOX_R, 0).applyQuaternion(invQ);
    const active = p.over ? 1 : 0;
    const RAD = 1.15;
    const smooth = 1 - Math.exp(-dt * 9);

    for (let i = 0; i < N; i++) {
      let wantX = 0;
      let wantY = 0;
      let wantZ = 0;
      if (active) {
        const dx = disp[i * 3] - repel.x;
        const dy = disp[i * 3 + 1] - repel.y;
        const dz = disp[i * 3 + 2] - repel.z;
        const d = Math.hypot(dx, dy, dz);
        if (d < RAD && d > 1e-4) {
          const f = Math.pow(1 - d / RAD, 2) * 0.85;
          wantX = (dx / d) * f;
          wantY = (dy / d) * f;
          wantZ = (dz / d) * f;
        }
      }
      push[i * 3] += (wantX - push[i * 3]) * smooth;
      push[i * 3 + 1] += (wantY - push[i * 3 + 1]) * smooth;
      push[i * 3 + 2] += (wantZ - push[i * 3 + 2]) * smooth;
      disp[i * 3] += push[i * 3];
      disp[i * 3 + 1] += push[i * 3 + 1];
      disp[i * 3 + 2] += push[i * 3 + 2];
    }

    if (bright !== 1) for (let i = 0; i < N3; i++) dcol[i] *= bright;

    posAttr.needsUpdate = true;
    if (morphing || shape.liveCol) colAttr.needsUpdate = true;

    // ── orientation: spin freely, or sway for the wide/flat/readable shapes ──
    const sp = shape.spin;
    const swaySpeed = sp.sp ?? 0.25;
    if (sp.sx != null) s.rx = sp.sx * Math.sin(t * swaySpeed * Math.PI);
    else s.rx += dt * (sp.x ?? 0);
    if (sp.sy != null) s.ry = sp.sy * Math.sin(t * swaySpeed * Math.PI * 0.8);
    else s.ry += dt * (sp.y ?? 0);

    // flat/readable shapes get a much smaller parallax, otherwise the cursor
    // alone can swing their wide edges out of frame
    const flat = sp.sx != null || sp.sy != null;
    groupRef.current.rotation.x = s.rx + p.y * (flat ? 0.06 : 0.18);
    groupRef.current.rotation.y = s.ry + p.x * (flat ? 0.07 : 0.3);
  });

  return (
    <group ref={groupRef}>
      <points geometry={buffers.pointsGeo} frustumCulled={false}>
        <pointsMaterial
          size={0.045}
          vertexColors
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <lineSegments geometry={buffers.lineGeo} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          color={SHAPES[0].accent}
          vertexColors
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

// ── public component ────────────────────────────────────────────────────────
export default function MorphOrb() {
  const [index, setIndex] = useState(0);
  const ptr = useRef<Ptr>({ x: 0, y: 0, over: false });
  const mode = useRef<MorphMode>("vortex");
  const autoCount = useRef(0);

  // pointer is tracked against the layout square, not the oversized canvas
  const onPointerMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    ptr.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const step = (delta: number, m: MorphMode) => {
    mode.current = m;
    setIndex((i) => (i + delta + SHAPES.length) % SHAPES.length);
  };

  const onIdle = () => {
    autoCount.current += 1;
    step(1, autoCount.current % 3 === 0 ? "nova" : "vortex");
  };

  return (
    <div className="relative h-full w-full select-none">
      {/* The canvas is drawn far larger than the square the orb is laid out in,
          and takes no pointer events, so an explosion can throw debris clear
          across the page instead of being cut off at the edge of its box.
          Pulling the camera back by the same factor keeps the orb the same
          on-screen size. */}
      <div
        className="pointer-events-none absolute [&_canvas]:!h-full [&_canvas]:!w-full"
        style={{ inset: `${((1 - CANVAS_SCALE) / 2) * 100}%` }}
      >
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
          // measure from offsetWidth/offsetHeight, not getBoundingClientRect:
          // the latter includes ancestor CSS transforms, so an entry animation
          // that scales a parent would bake a wrong canvas size in on mount
          resize={{ scroll: false, offsetSize: true }}
          dpr={[1, 1.5]}
        >
          <MorphBody index={index} mode={mode} ptr={ptr} onIdle={onIdle} />
          <CometSwarm />
        </Canvas>
      </div>

      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => step(1, "shatter")}
        onPointerMove={onPointerMove}
        onPointerEnter={() => (ptr.current.over = true)}
        onPointerLeave={() => (ptr.current.over = false)}
        title="Click it"
      />

    </div>
  );
}
