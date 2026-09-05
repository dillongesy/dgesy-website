// Pure geometry + animation math for the hero orb. No React, no JSX — so it
// can be exercised straight from node (see scripts/orb-shapes-smoke.cjs).

import * as THREE from "three";

export const N = 1800;
export const N3 = N * 3;
export const HOLD_SECONDS = 6.5;

// The canvas is rendered much larger than the square it is laid out in, so
// debris can fly clear across the page without being sliced off at its edge.
// BOX_R is the world half-extent of that layout square: shapes at rest should
// stay roughly inside it, explosions are free to leave it.
export const CANVAS_SCALE = 2.6;
export const CAMERA_Z = 6.5 * CANVAS_SCALE;
export const BOX_R = Math.tan((45 * Math.PI) / 180 / 2) * 6.5; // ≈ 2.69

export type Built = {
  pos: Float32Array;
  col: Float32Array;
  edges: Uint16Array;
  aux?: Float32Array; // per-point scratch, stride depends on the shape
  owner?: Uint16Array; // which polyline a point came from
  param?: Float32Array; // 0..1 along that polyline
};

export type Spin = {
  x?: number; // radians/sec around X
  y?: number; // radians/sec around Y
  sx?: number; // sway amplitude around X (overrides x)
  sy?: number; // sway amplitude around Y (overrides y)
  sp?: number; // sway speed
};

export type Shape = {
  id: string;
  label: string;
  accent: string;
  spin: Spin;
  build: () => Built;
  live?: (out: Float32Array, b: Built, t: number, dt: number) => void;
  liveCol?: (out: Float32Array, b: Built, t: number) => void;
};

// ── helpers ─────────────────────────────────────────────────────────────────
export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const C = {
  indigo: new THREE.Color("#818cf8"),
  cyan: new THREE.Color("#22d3ee"),
  purple: new THREE.Color("#a78bfa"),
  sky: new THREE.Color("#38bdf8"),
  emerald: new THREE.Color("#34d399"),
  green: new THREE.Color("#4ade80"),
  lime: new THREE.Color("#a3e635"),
  teal: new THREE.Color("#2dd4bf"),
  amber: new THREE.Color("#fbbf24"),
  orange: new THREE.Color("#fb923c"),
  rose: new THREE.Color("#fb7185"),
  pink: new THREE.Color("#f472b6"),
  red: new THREE.Color("#ef4444"),
  yellow: new THREE.Color("#facc15"),
  blue: new THREE.Color("#3b82f6"),
  cream: new THREE.Color("#fde68a"),
  ice: new THREE.Color("#cffafe"),
  white: new THREE.Color("#f1f5f9"),
  slate: new THREE.Color("#64748b"),
};

const _c = new THREE.Color();
function put(col: Float32Array, i: number, a: THREE.Color, b?: THREE.Color, t = 0) {
  _c.copy(a);
  if (b) _c.lerp(b, Math.max(0, Math.min(1, t)));
  col[i * 3] = _c.r;
  col[i * 3 + 1] = _c.g;
  col[i * 3 + 2] = _c.b;
}

function scaleCol(out: Float32Array, i: number, k: number) {
  out[i * 3] *= k;
  out[i * 3 + 1] *= k;
  out[i * 3 + 2] *= k;
}

type P3 = [number, number, number];
type Poly = { pts: P3[]; closed?: boolean };

const dist3 = (a: P3, b: P3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Uniform-grid neighbour search — used instead of an O(n²) sweep for the
// shapes that wire themselves up by proximity.
function neighborEdges(pos: Float32Array, count: number, radius: number, maxDeg: number) {
  const cell = radius;
  const buckets = new Map<number, number[]>();
  const cx = (v: number) => Math.floor(v / cell) + 512;
  const key = (a: number, b: number, c: number) => (a * 1024 + b) * 1024 + c;

  for (let i = 0; i < count; i++) {
    const k = key(cx(pos[i * 3]), cx(pos[i * 3 + 1]), cx(pos[i * 3 + 2]));
    const arr = buckets.get(k);
    if (arr) arr.push(i);
    else buckets.set(k, [i]);
  }

  const edges: number[] = [];
  const deg = new Uint8Array(count);
  const r2 = radius * radius;

  for (let i = 0; i < count; i++) {
    if (deg[i] >= maxDeg) continue;
    const ax = cx(pos[i * 3]);
    const ay = cx(pos[i * 3 + 1]);
    const az = cx(pos[i * 3 + 2]);
    for (let dx = -1; dx <= 1 && deg[i] < maxDeg; dx++) {
      for (let dy = -1; dy <= 1 && deg[i] < maxDeg; dy++) {
        for (let dz = -1; dz <= 1 && deg[i] < maxDeg; dz++) {
          const arr = buckets.get(key(ax + dx, ay + dy, az + dz));
          if (!arr) continue;
          for (const j of arr) {
            if (j <= i || deg[i] >= maxDeg || deg[j] >= maxDeg) continue;
            const ddx = pos[i * 3] - pos[j * 3];
            const ddy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const ddz = pos[i * 3 + 2] - pos[j * 3 + 2];
            if (ddx * ddx + ddy * ddy + ddz * ddz < r2) {
              edges.push(i, j);
              deg[i]++;
              deg[j]++;
            }
          }
        }
      }
    }
  }
  return edges;
}

// Resample polylines into exactly `total` points, wiring consecutive points as
// edges and recording which line each point came from.
function resamplePolys(polys: Poly[], total: number) {
  const chains = polys.map((p) => (p.closed ? [...p.pts, p.pts[0]] : p.pts));
  const lens = chains.map((pts) => {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += dist3(pts[i - 1], pts[i]);
    return L;
  });
  const sum = lens.reduce((a, b) => a + b, 0) || 1;
  const counts = lens.map((l) => Math.max(2, Math.floor((total * l) / sum)));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  for (let guard = 0; diff !== 0 && guard < total * 4; guard++) {
    const i = guard % counts.length;
    if (diff > 0) {
      counts[i]++;
      diff--;
    } else if (counts[i] > 2) {
      counts[i]--;
      diff++;
    }
  }

  const pos = new Float32Array(total * 3);
  const owner = new Uint16Array(total);
  const param = new Float32Array(total);
  const edges: number[] = [];
  let o = 0;

  chains.forEach((pts, pi) => {
    const c = counts[pi];
    const closed = !!polys[pi].closed;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist3(pts[i - 1], pts[i]));
    const L = cum[cum.length - 1] || 1;

    for (let i = 0; i < c; i++) {
      const f = closed ? i / c : i / (c - 1);
      const d = f * L;
      let s = 1;
      while (s < cum.length - 1 && cum[s] < d) s++;
      const seg = Math.max(1e-6, cum[s] - cum[s - 1]);
      const t = (d - cum[s - 1]) / seg;
      const a = pts[s - 1];
      const b = pts[s];
      pos[(o + i) * 3] = a[0] + (b[0] - a[0]) * t;
      pos[(o + i) * 3 + 1] = a[1] + (b[1] - a[1]) * t;
      pos[(o + i) * 3 + 2] = a[2] + (b[2] - a[2]) * t;
      owner[o + i] = pi;
      param[o + i] = f;
    }
    for (let i = 0; i < c - 1; i++) edges.push(o + i, o + i + 1);
    if (closed) edges.push(o + c - 1, o);
    o += c;
  });

  return { pos, owner, param, edges };
}

function paintByHeight(pos: Float32Array, col: Float32Array, lo: THREE.Color, hi: THREE.Color) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < N; i++) {
    const y = pos[i * 3 + 1];
    if (y < min) min = y;
    if (y > max) max = y;
  }
  const span = Math.max(1e-6, max - min);
  for (let i = 0; i < N; i++) put(col, i, lo, hi, (pos[i * 3 + 1] - min) / span);
}

// A gaussian bump on a looping 0..1 track.
function pulseAt(param: number, phase: number, width = 0.09) {
  let d = param - phase;
  d -= Math.floor(d);
  const a = d;
  const b = d - 1;
  return Math.exp(-(a * a) / (width * width)) + Math.exp(-(b * b) / (width * width));
}

// ── 1. constellation sphere ─────────────────────────────────────────────────
function buildSphere(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  const R = 2.25;
  const golden = Math.PI * (Math.sqrt(5) - 1);
  const cycle = [C.indigo, C.cyan, C.purple, C.sky];

  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    pos[i * 3] = Math.cos(th) * r * R;
    pos[i * 3 + 1] = y * R;
    pos[i * 3 + 2] = Math.sin(th) * r * R;
    put(col, i, cycle[i % cycle.length]);
  }
  return { pos, col, edges: new Uint16Array(neighborEdges(pos, N, 0.27, 4)) };
}

// ── 2. orb of leaves ────────────────────────────────────────────────────────
const LEAVES = 90;
const PER_LEAF = 20; // 9 right edge + 7 left edge + 4 midrib

function buildLeaves(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  const aux = new Float32Array(N * 2); // [v, leafIndex]
  const edges: number[] = [];
  const rnd = mulberry32(7);
  const R = 1.78;
  const golden = Math.PI * (Math.sqrt(5) - 1);

  const n = new THREE.Vector3();
  const a = new THREE.Vector3();
  const p = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const base = new THREE.Vector3();

  for (let li = 0; li < LEAVES; li++) {
    const y = 1 - (li / (LEAVES - 1)) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * li;
    n.set(Math.cos(th) * rr, y, Math.sin(th) * rr).normalize();

    tmp.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5);
    a.copy(tmp).addScaledVector(n, -tmp.dot(n)).normalize();
    p.crossVectors(n, a).normalize();
    base.copy(n).multiplyScalar(R);

    const len = 0.62 + rnd() * 0.4;
    const maxHalf = len * 0.33;
    const o = li * PER_LEAF;
    const S = 8;

    // Ovate leaf: widest ~36% up from the base, pointed tip, ridged midrib and
    // a curled tip so it reads as a real leaf rather than a diamond.
    const write = (idx: number, v: number, side: number) => {
      const w = (Math.pow(v, 0.5) * Math.pow(1 - v, 0.9)) / 0.401;
      const half = w * maxHalf * side;
      const lift = Math.sin(Math.PI * v) * 0.08 * (side === 0 ? 1 : 0.35) + v * v * 0.26;
      pos[idx * 3] = base.x + a.x * len * v + p.x * half + n.x * lift;
      pos[idx * 3 + 1] = base.y + a.y * len * v + p.y * half + n.y * lift;
      pos[idx * 3 + 2] = base.z + a.z * len * v + p.z * half + n.z * lift;
      aux[idx * 2] = v;
      aux[idx * 2 + 1] = li;
      const tint = li % 5 === 0 ? C.teal : li % 3 === 0 ? C.lime : C.green;
      put(col, idx, C.emerald, tint, 0.25 + v * 0.75);
    };

    for (let j = 0; j <= S; j++) write(o + j, j / S, 1); //                 o+0 .. o+8
    for (let j = S - 1; j >= 1; j--) write(o + 9 + (S - 1 - j), j / S, -1); // o+9 .. o+15
    for (let j = 0; j < 4; j++) write(o + 16 + j, 0.2 + j * 0.2, 0); //     o+16 .. o+19

    for (let j = 0; j < 16; j++) edges.push(o + j, o + ((j + 1) % 16));
    edges.push(o + 0, o + 16, o + 16, o + 17, o + 17, o + 18, o + 18, o + 19, o + 19, o + 8);
  }
  return { pos, col, edges: new Uint16Array(edges), aux };
}

function liveLeaves(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  for (let i = 0; i < N; i++) {
    const v = aux[i * 2];
    const li = aux[i * 2 + 1];
    const k = 1 + 0.07 * v * Math.sin(t * 1.7 + li * 1.3) + 0.015 * Math.sin(t * 0.8);
    out[i * 3] = b.pos[i * 3] * k;
    out[i * 3 + 1] = b.pos[i * 3 + 1] * k;
    out[i * 3 + 2] = b.pos[i * 3 + 2] * k;
  }
}

// ── 3. stepped monolith ─────────────────────────────────────────────────────
function buildPyramid(): Built {
  const apexY = 1.85;
  const baseY = -1.55;
  const S = 1.5;
  const ring = (s: number, y: number): P3[] => [
    [-s, y, -s],
    [s, y, -s],
    [s, y, s],
    [-s, y, s],
  ];
  const apex: P3 = [0, apexY, 0];
  const lerpTo = (c: P3, f: number): P3 => [
    c[0] + (apex[0] - c[0]) * f,
    c[1] + (apex[1] - c[1]) * f,
    c[2] + (apex[2] - c[2]) * f,
  ];

  const polys: Poly[] = [{ pts: ring(S, baseY), closed: true }];
  const corners = ring(S, baseY);

  // four hard ribs from base to apex
  for (const c of corners) polys.push({ pts: [apex, c] });

  // stepped belts, and a brace from each belt corner back down to the base
  for (const f of [0.18, 0.36, 0.54, 0.72, 0.86]) {
    const belt = ring(S * (1 - f), baseY + (apexY - baseY) * f);
    polys.push({ pts: belt, closed: true });
    for (let i = 0; i < 4; i++) polys.push({ pts: [belt[i], corners[i]] });
  }

  // face diagonals: every belt corner tied to the next rib along
  for (const f of [0.18, 0.54]) {
    const belt = ring(S * (1 - f), baseY + (apexY - baseY) * f);
    for (let i = 0; i < 4; i++) polys.push({ pts: [belt[i], corners[(i + 1) % 4]] });
  }

  // base cross-bracing
  polys.push({ pts: [corners[0], corners[2]] });
  polys.push({ pts: [corners[1], corners[3]] });
  for (const g of [-0.5, 0.5]) {
    polys.push({ pts: [[-S, baseY, g * S], [S, baseY, g * S]] });
    polys.push({ pts: [[g * S, baseY, -S], [g * S, baseY, S]] });
  }
  // inner spire
  polys.push({ pts: [[0, baseY, 0], apex] });
  for (const c of corners) polys.push({ pts: [[0, baseY, 0], lerpTo(c, 0.55)] });

  const { pos, edges } = resamplePolys(polys, N);
  const col = new Float32Array(N3);
  paintByHeight(pos, col, C.orange, C.cream);
  return { pos, col, edges: new Uint16Array(edges) };
}

// ── 4. rolling terrain, with a road through it ──────────────────────────────
// A little landscape rather than a bare mesh: a lit road cutting across the
// hills, a river carving a channel, and a scatter of conifers. Everything is
// authored in (x, z, height) on the ground plane and tilted together, so trees
// and lamp posts stand up out of the terrain automatically.
const GRID = 30;
const GRID_PTS = GRID * GRID; // 900
const BLADES = 78;
const LAMPS = 8;
const TREES = 22;
const BANK_PTS = 40; // per bank
const WATER_PTS = 70;

const EXT_X = 2.45;
const EXT_Z = 2.8;
const SCENE_Z = 2.62; // road and river stop just inside the fade
const TILT = 0.4; // near-horizontal: a landscape, not a top-down map
const T_COS = Math.cos(TILT);
const T_SIN = Math.sin(TILT);

const ROAD_X = -1.15;
const ROAD_HALF = 0.26;
const riverX = (z: number) => 1.25 + 0.45 * Math.sin(z * 0.85 + 0.4);

// Water has no fixed z of its own: it is carried downstream from a phase and
// wraps back to the head of the river. Build and live both place it from here.
function waterAt(phase: number, t: number) {
  let f = (t * 0.16 + phase) % 1;
  if (f < 0) f += 1;
  const z = -SCENE_Z + f * 2 * SCENE_Z;
  return { x: riverX(z), z };
}

const GROUND = 0;
const GRASS = 1;
const ROAD = 2;
const LAMP = 3;
const LAMP_HEAD = 4;
const TREE = 5;
const BANK = 6;
const WATER = 7;

// Rectangular falloff: a wide flat plateau with a soft perimeter. Fading each
// axis independently (and taking the min) keeps the patch square-cornered
// instead of rounding it into an ellipse, while still having no hard border.
const FADE = 0.26;
const terrainMask = (x: number, z: number) =>
  Math.min(
    clamp01((1 - Math.abs(x) / EXT_X) / FADE),
    clamp01((1 - Math.abs(z) / EXT_Z) / FADE),
  );

// Long ridges rolling toward the viewer, levelled off along the road corridor
// and cut into a channel where the river runs.
function groundH(x: number, z: number, t: number) {
  const ridges =
    0.3 * Math.sin(z * 0.85 + t * 1.15) +
    0.16 * Math.sin(x * 0.55 - t * 0.35) +
    0.07 * Math.sin(x * 1.7 + z * 1.3 - t * 0.8);
  const road = Math.exp(-Math.pow((x - ROAD_X) / 0.6, 2));
  const dr = (x - riverX(z)) / 0.5;
  const river = Math.exp(-dr * dr);
  const shaped = ridges * (1 - 0.5 * road) * (1 - 0.6 * river) - 0.2 * river;
  // ease the ridges down into the fade so nothing pokes through the edge
  return shaped * (0.45 + 0.55 * terrainMask(x, z));
}

function placeTerrain(out: Float32Array, i: number, x: number, z: number, h: number) {
  out[i * 3] = x;
  out[i * 3 + 1] = h * T_COS - z * T_SIN - 0.1;
  out[i * 3 + 2] = h * T_SIN + z * T_COS;
}

function buildTerrain(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  // [baseX, baseZ, dx, dz, dh, kind] — offsets are relative to the footing on
  // the ground, so a whole tree rides its own patch of hillside.
  const aux = new Float32Array(N * 6);
  const edges: number[] = [];
  const rnd = mulberry32(21);
  let n = 0;

  const set = (bx: number, bz: number, dx: number, dz: number, dh: number, kind: number) => {
    const i = n++;
    if (kind === WATER) {
      // dz is a drift phase, not an offset — start it where it will flow from
      const w = waterAt(dz, 0);
      bx = w.x;
      bz = w.z;
    }
    aux[i * 6] = bx;
    aux[i * 6 + 1] = bz;
    aux[i * 6 + 2] = dx;
    aux[i * 6 + 3] = dz;
    aux[i * 6 + 4] = dh;
    aux[i * 6 + 5] = kind;
    placeTerrain(pos, i, bx + dx, kind === WATER ? bz : bz + dz, groundH(bx, bz, 0) + dh);
    return i;
  };
  const chain = (from: number, count: number) => {
    for (let k = 0; k < count - 1; k++) edges.push(from + k, from + k + 1);
  };

  // ── ground mesh ──
  for (let r = 0; r < GRID; r++) {
    for (let c2 = 0; c2 < GRID; c2++) {
      const i = set(
        (c2 / (GRID - 1) - 0.5) * 2 * EXT_X,
        (r / (GRID - 1) - 0.5) * 2 * EXT_Z,
        0,
        0,
        0,
        GROUND,
      );
      if (c2 < GRID - 1) edges.push(i, i + 1);
      if (r < GRID - 1) edges.push(i, i + GRID);
    }
  }

  const onRoad = (x: number) => Math.abs(x - ROAD_X) < ROAD_HALF + 0.3;
  const inRiver = (x: number, z: number) => Math.abs(x - riverX(z)) < 0.5;

  // ── grass tufts, wired back to the node they sprout from ──
  for (let k = 0; k < BLADES; k++) {
    let node = Math.floor(rnd() * GRID_PTS);
    for (let tries = 0; tries < 10; tries++) {
      const x = aux[node * 6];
      const z = aux[node * 6 + 1];
      if (terrainMask(x, z) > 0.35 && !onRoad(x) && !inRiver(x, z)) break;
      node = Math.floor(rnd() * GRID_PTS);
    }
    const i = set(
      aux[node * 6] + (rnd() - 0.5) * 0.1,
      aux[node * 6 + 1] + (rnd() - 0.5) * 0.1,
      0,
      0,
      0.18 + rnd() * 0.22,
      GRASS,
    );
    edges.push(node, i);
  }

  // ── the road: two edge lines running to the horizon, plus centre dashes ──
  for (const side of [-1, 1]) {
    const startI = n;
    for (let k = 0; k < 55; k++) {
      const z = -SCENE_Z + (k / 54) * 2 * SCENE_Z;
      set(ROAD_X + side * ROAD_HALF, z, 0, 0, 0.012, ROAD);
    }
    chain(startI, 55);
  }
  for (let d = 0; d < 12; d++) {
    const startI = n;
    const z0 = -SCENE_Z + (d / 11.5) * 2 * SCENE_Z;
    for (let k = 0; k < 4; k++) set(ROAD_X, z0 + (k / 3) * 0.22, 0, 0, 0.014, ROAD);
    chain(startI, 4);
  }
  for (let k = 0; k < 42; k++) {
    set(ROAD_X + (rnd() - 0.5) * 2 * ROAD_HALF, (rnd() - 0.5) * 2 * SCENE_Z, 0, 0, 0.008, ROAD);
  }

  // ── street lights: pole, arm reaching over the road, glowing head ──
  for (let l = 0; l < LAMPS; l++) {
    const lz = -SCENE_Z + ((l + 0.5) / LAMPS) * 2 * SCENE_Z;
    const lx = ROAD_X + ROAD_HALF + 0.16;
    const H = 0.62;
    const poleStart = n;
    for (let k = 0; k < 8; k++) set(lx, lz, 0, 0, (k / 7) * H, LAMP);
    chain(poleStart, 8);
    const armStart = n;
    for (let k = 0; k < 4; k++) {
      const f = (k + 1) / 4;
      set(lx, lz, -f * 0.34, 0, H - f * f * 0.05, LAMP);
    }
    chain(armStart, 4);
    edges.push(poleStart + 7, armStart);
    const headStart = n;
    for (let k = 0; k < 3; k++) {
      set(lx, lz, -0.34 - (k % 2) * 0.03, (k - 1) * 0.03, H - 0.06 - (k === 2 ? 0.03 : 0), LAMP_HEAD);
    }
    edges.push(armStart + 3, headStart, headStart, headStart + 1, headStart + 1, headStart + 2);
  }

  // ── conifers: trunk, three tiers of branches, a leader at the top ──
  for (let tIdx = 0; tIdx < TREES; tIdx++) {
    let tx = 0;
    let tz = 0;
    for (let tries = 0; tries < 40; tries++) {
      tx = (rnd() - 0.5) * 2 * EXT_X * 0.92;
      tz = (rnd() - 0.5) * 2 * EXT_Z * 0.9;
      if (terrainMask(tx, tz) > 0.3 && !onRoad(tx) && !inRiver(tx, tz)) break;
    }
    const H = 0.46 + rnd() * 0.34;
    const trunk = n;
    for (let k = 0; k < 3; k++) set(tx, tz, 0, 0, (k / 2) * 0.14 * H, TREE);
    chain(trunk, 3);

    const tiers: number[] = [];
    for (let tier = 0; tier < 3; tier++) {
      const dh = (0.32 + tier * 0.22) * H;
      const rad = (0.27 - tier * 0.075) * H;
      const ring = n;
      tiers.push(ring);
      set(tx, tz, rad, 0, dh, TREE);
      set(tx, tz, 0, rad, dh, TREE);
      set(tx, tz, -rad, 0, dh, TREE);
      set(tx, tz, 0, -rad, dh, TREE);
      for (let k = 0; k < 4; k++) edges.push(ring + k, ring + ((k + 1) % 4));
      if (tier > 0) for (let k = 0; k < 4; k++) edges.push(tiers[tier - 1] + k, ring + k);
    }
    for (let k = 0; k < 4; k++) edges.push(trunk + 2, tiers[0] + k);
    const apex = set(tx, tz, 0, 0, H, TREE);
    for (let k = 0; k < 4; k++) edges.push(tiers[2] + k, apex);
  }

  // ── the river: two banks and a drifting surface ──
  for (const side of [-1, 1]) {
    const startI = n;
    for (let k = 0; k < BANK_PTS; k++) {
      const z = -SCENE_Z + (k / (BANK_PTS - 1)) * 2 * SCENE_Z;
      set(riverX(z) + side * 0.3, z, 0, 0, -0.02, BANK);
    }
    chain(startI, BANK_PTS);
  }
  for (let k = 0; k < WATER_PTS; k++) {
    // dz carries the drift phase for water, which has no fixed z of its own
    set(0, 0, (rnd() - 0.5) * 0.44, rnd(), -0.045, WATER);
  }

  // ── colour: rim fade x depth haze, so the scene recedes into the dark ──
  for (let i = 0; i < N; i++) {
    const kind = aux[i * 6 + 5];
    const x = aux[i * 6] + aux[i * 6 + 2];
    const z = aux[i * 6 + 1];
    const dh = aux[i * 6 + 4];
    const depth = clamp01((z + EXT_Z) / (2 * EXT_Z));

    if (kind === GROUND) put(col, i, C.emerald, C.teal, 0.25 + depth * 0.5);
    else if (kind === GRASS) put(col, i, C.lime, C.green, 0.4);
    else if (kind === ROAD) put(col, i, C.slate, C.ice, 0.45);
    else if (kind === LAMP) put(col, i, C.slate, C.indigo, 0.3);
    else if (kind === LAMP_HEAD) put(col, i, C.cream, C.white, 0.4);
    else if (kind === TREE) put(col, i, dh < 0.16 ? C.orange : C.emerald, C.lime, dh * 1.1);
    else if (kind === BANK) put(col, i, C.teal, C.emerald, 0.4);
    else put(col, i, C.ice, C.cyan, 0.5);

    const haze = kind === GROUND ? 0.5 + (1 - depth) * 0.8 : 0.62 + (1 - depth) * 0.7;
    scaleCol(col, i, Math.pow(terrainMask(x, z), 1.3) * haze * (kind === LAMP_HEAD ? 1.6 : 1));
  }
  return { pos, col, edges: new Uint16Array(edges), aux };
}

function liveTerrain(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  for (let i = 0; i < N; i++) {
    const kind = aux[i * 6 + 5];
    let bx = aux[i * 6];
    let bz = aux[i * 6 + 1];
    const dx = aux[i * 6 + 2];
    const dh = aux[i * 6 + 4];
    let dz = aux[i * 6 + 3];

    if (kind === WATER) {
      const w = waterAt(dz, t);
      bx = w.x;
      bz = w.z;
      dz = 0;
    }

    let x = bx + dx;
    if (kind === GRASS) x += Math.sin(t * 2.4 + bx * 1.6 + bz) * 0.075;
    else if (kind === TREE) x += Math.sin(t * 1.5 + bx * 2.1 + bz) * dh * 0.09;

    placeTerrain(out, i, x, bz + dz, groundH(bx, bz, t) + dh);
  }
}

function liveTerrainCol(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  out.set(b.col);
  for (let i = 0; i < N; i++) {
    const kind = aux[i * 6 + 5];
    // only the lamps and the water are alive; everything else keeps its colour
    if (kind === LAMP_HEAD) scaleCol(out, i, 0.85 + 0.25 * Math.sin(t * 1.7 + aux[i * 6 + 1] * 3));
    else if (kind === WATER) {
      const w = waterAt(aux[i * 6 + 3], t);
      const glint = Math.pow((Math.sin(w.z * 5.5 - t * 3) + 1) / 2, 3);
      scaleCol(out, i, (0.45 + glint * 1.4) * Math.pow(terrainMask(w.x, w.z), 1.3));
    }
  }
}

// ── 5. spiral galaxy ────────────────────────────────────────────────────────
// Tilt is baked into the geometry and the group only sways, so the disc can
// never rotate edge-on and collapse into a line.
const BULGE = 300;
const ARMS = 6;
const PER_ARM = (N - BULGE) / ARMS; // 250
const G_TILT = 0.62;
const G_COS = Math.cos(G_TILT);
const G_SIN = Math.sin(G_TILT);

function galaxyPlace(out: Float32Array, i: number, r: number, th: number, y: number) {
  const x = Math.cos(th) * r;
  const z = Math.sin(th) * r;
  out[i * 3] = x;
  out[i * 3 + 1] = y * G_COS - z * G_SIN;
  out[i * 3 + 2] = y * G_SIN + z * G_COS;
}

function buildGalaxy(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  const aux = new Float32Array(N3); // [r, theta0, y]
  const edges: number[] = [];
  const rnd = mulberry32(99);

  // central bulge — a real 3D core, so there is volume even at a shallow angle
  for (let i = 0; i < BULGE; i++) {
    const r = 0.62 * Math.pow(rnd(), 0.55);
    const th = rnd() * Math.PI * 2;
    const y = (rnd() - 0.5) * 2 * r * 0.75;
    aux[i * 3] = r;
    aux[i * 3 + 1] = th;
    aux[i * 3 + 2] = y;
    galaxyPlace(pos, i, r, th, y);
    put(col, i, C.white, C.cream, r / 0.62);
  }

  for (let arm = 0; arm < ARMS; arm++) {
    for (let k = 0; k < PER_ARM; k++) {
      const i = BULGE + arm * PER_ARM + k;
      const f = k / (PER_ARM - 1);
      const r = 0.42 + Math.pow(f, 0.85) * 1.93;
      const th = (arm / ARMS) * Math.PI * 2 + r * 1.5 + (rnd() - 0.5) * 0.32;
      const y = (rnd() - 0.5) * 0.42 * Math.exp(-r * 0.5);
      aux[i * 3] = r;
      aux[i * 3 + 1] = th;
      aux[i * 3 + 2] = y;
      galaxyPlace(pos, i, r, th, y);
      if (k < PER_ARM - 1) edges.push(i, i + 1);
      put(col, i, C.cream, r < 1.2 ? C.purple : C.cyan, Math.min(1, (r - 0.4) / 1.3));
    }
  }
  return { pos, col, edges: new Uint16Array(edges), aux };
}

function liveGalaxy(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  for (let i = 0; i < N; i++) {
    const r = aux[i * 3];
    // differential rotation: the core whips around, the arms trail
    const th = aux[i * 3 + 1] + (t * 0.95) / (0.55 + r);
    galaxyPlace(out, i, r, th, aux[i * 3 + 2]);
  }
}

// ── 6. DNA that unzips ──────────────────────────────────────────────────────
const STRAND = 450;
const RUNGS = 60;
const RUNG_PTS = 15;
const HELIX_R = 1.0;
const HELIX_TURNS = 3.5;

function helixXY(f: number, off: number, radius: number) {
  const th = f * Math.PI * 2 * HELIX_TURNS + off;
  return { x: Math.cos(th) * radius, z: Math.sin(th) * radius };
}

function buildHelix(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  const aux = new Float32Array(N3); // [f, strandSide(-1/0/1), rungU]
  const edges: number[] = [];

  const write = (
    i: number,
    f: number,
    side: number,
    u: number,
    c1: THREE.Color,
    c2: THREE.Color,
    m: number,
  ) => {
    const off = side > 0 ? Math.PI : 0;
    const radius = side === 0 ? HELIX_R * (2 * u - 1) : HELIX_R;
    const { x, z } = helixXY(f, side === 0 ? 0 : off, radius);
    pos[i * 3] = x;
    pos[i * 3 + 1] = (f - 0.5) * 4.3;
    pos[i * 3 + 2] = z;
    aux[i * 3] = f;
    aux[i * 3 + 1] = side;
    aux[i * 3 + 2] = u;
    put(col, i, c1, c2, m);
  };

  for (let s = 0; s < 2; s++) {
    for (let k = 0; k < STRAND; k++) {
      const i = s * STRAND + k;
      write(i, k / (STRAND - 1), s === 0 ? -1 : 1, 0, s === 0 ? C.cyan : C.purple, C.indigo, 0.35);
      if (k < STRAND - 1) edges.push(i, i + 1);
    }
  }

  const rungBase = STRAND * 2;
  for (let r = 0; r < RUNGS; r++) {
    const f = (r + 0.5) / RUNGS;
    for (let k = 0; k < RUNG_PTS; k++) {
      const i = rungBase + r * RUNG_PTS + k;
      write(i, f, 0, k / (RUNG_PTS - 1), r % 2 ? C.emerald : C.rose, C.cream, 0.25);
      if (k < RUNG_PTS - 1) edges.push(i, i + 1);
    }
  }
  return { pos, col, edges: new Uint16Array(edges), aux };
}

// A replication fork travels up the helix: ahead of it the strands are paired,
// behind it they splay apart and the base pairs collapse into their strand.
function forkAt(t: number) {
  return ((t * 0.16) % 1.6) - 0.3;
}

function liveHelix(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  const fork = forkAt(t);
  const spin = t * 0.4;
  const ca = Math.cos(spin);
  const sa = Math.sin(spin);
  for (let i = 0; i < N; i++) {
    const f = aux[i * 3];
    const side = aux[i * 3 + 1];
    const u = aux[i * 3 + 2];
    const open = clamp01((fork - f) * 6); // 0 = still zipped, 1 = separated
    const y = (f - 0.5) * 4.3;
    let x: number;
    let z: number;

    if (side === 0) {
      const near = u < 0.5 ? -1 : 1;
      const zipped = helixXY(f, 0, HELIX_R * (2 * u - 1));
      const merged = helixXY(f, near > 0 ? Math.PI : 0, HELIX_R * (1 + open * 0.55));
      x = zipped.x + (merged.x - zipped.x) * open;
      z = zipped.z + (merged.z - zipped.z) * open;
      out[i * 3 + 1] = y;
    } else {
      const p = helixXY(f, side > 0 ? Math.PI : 0, HELIX_R * (1 + open * 0.55));
      x = p.x;
      z = p.z;
      out[i * 3 + 1] = y + open * side * 0.06;
    }

    out[i * 3] = x * ca - z * sa;
    out[i * 3 + 2] = x * sa + z * ca;
  }
}

function liveHelixCol(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  const fork = forkAt(t);
  for (let i = 0; i < N; i++) {
    const f = aux[i * 3];
    const side = aux[i * 3 + 1];
    const open = clamp01((fork - f) * 6);
    const hot = Math.exp(-Math.pow((f - fork) * 9, 2)); // glow at the fork itself
    const base =
      side === 0 ? (Math.floor(f * RUNGS) % 2 ? C.emerald : C.rose) : side < 0 ? C.cyan : C.purple;
    put(out, i, base, C.white, hot * 0.9);
    scaleCol(out, i, 0.55 + hot * 0.9 + (1 - open) * 0.25);
  }
}

// ── 7. woven torus knot ─────────────────────────────────────────────────────
function buildKnot(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  const aux = new Float32Array(N);
  const edges: number[] = [];
  const p = 3;
  const q = 2;

  for (let i = 0; i < N; i++) {
    const u = (i / N) * Math.PI * 2;
    const r = 0.7 * (2 + Math.cos(q * u));
    pos[i * 3] = r * Math.cos(p * u);
    pos[i * 3 + 1] = r * Math.sin(p * u);
    pos[i * 3 + 2] = 0.7 * Math.sin(q * u) * 1.5;
    aux[i] = u;
    put(col, i, C.pink, C.indigo, (Math.sin(u * 1.5) + 1) / 2);
    edges.push(i, (i + 1) % N);
  }

  // chords across the curve — string-art weave through the middle of the knot
  for (let i = 0; i < N; i += 2) edges.push(i, (i + 137) % N);
  for (let i = 0; i < N; i += 3) edges.push(i, (i + 601) % N);
  for (let i = 0; i < N; i += 5) edges.push(i, (i + 899) % N);

  return { pos, col, edges: new Uint16Array(edges), aux };
}

function liveKnot(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  for (let i = 0; i < N; i++) {
    const k = 1 + 0.08 * Math.sin(aux[i] * 4 - t * 2.4);
    out[i * 3] = b.pos[i * 3] * k;
    out[i * 3 + 1] = b.pos[i * 3 + 1] * k;
    out[i * 3 + 2] = b.pos[i * 3 + 2] * k;
  }
}

function liveKnotCol(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  for (let i = 0; i < N; i++) {
    const glow = Math.pow((Math.sin(aux[i] * 3 - t * 2.2) + 1) / 2, 3);
    put(out, i, C.pink, C.cyan, (Math.sin(aux[i] * 1.5) + 1) / 2);
    scaleCol(out, i, 0.5 + glow * 1.1);
  }
}

// ── 8. Klein bottle ─────────────────────────────────────────────────────────
const SURF_U = 90;
const SURF_V = N / SURF_U; // 20

// `wrap` says which v the last u-ring stitches onto — the figure-8 immersion
// closes half a turn around in v.
function surfaceEdges(wrap: (v: number) => number, closedV: boolean) {
  const edges: number[] = [];
  for (let u = 0; u < SURF_U; u++) {
    for (let v = 0; v < SURF_V; v++) {
      const i = u * SURF_V + v;
      if (v < SURF_V - 1) edges.push(i, i + 1);
      else if (closedV) edges.push(i, u * SURF_V);
      if (u < SURF_U - 1) edges.push(i, i + SURF_V);
    }
  }
  const last = (SURF_U - 1) * SURF_V;
  for (let v = 0; v < SURF_V; v++) edges.push(last + v, wrap(v));
  return edges;
}

function buildKlein(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  const aux = new Float32Array(N * 2);
  const r = 1.55;
  const tilt = 1.0;
  const k = 0.82;

  for (let ui = 0; ui < SURF_U; ui++) {
    const u = (ui / SURF_U) * Math.PI * 2;
    for (let vi = 0; vi < SURF_V; vi++) {
      const i = ui * SURF_V + vi;
      const v = (vi / SURF_V) * Math.PI * 2;
      // figure-8 immersion
      const rad = r + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
      const x = rad * Math.cos(u) * k;
      const y0 = rad * Math.sin(u) * k;
      const z0 = (Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v)) * k;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      pos[i * 3 + 2] = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
      aux[i * 2] = ui / SURF_U;
      aux[i * 2 + 1] = vi / SURF_V;
      put(col, i, C.rose, C.indigo, vi / SURF_V);
    }
  }
  return {
    pos,
    col,
    edges: new Uint16Array(surfaceEdges((v) => (v + SURF_V / 2) % SURF_V, true)),
    aux,
  };
}

function liveKleinCol(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  const head = (t * 0.15) % 1;
  for (let i = 0; i < N; i++) {
    const glow = pulseAt(aux[i * 2], head, 0.11);
    put(out, i, C.rose, C.indigo, aux[i * 2 + 1]);
    scaleCol(out, i, 0.5 + glow * 1.2);
  }
}

// ── 9. Rubik's cube that solves nothing ─────────────────────────────────────
const CUBIE = 0.44; // half-size
const SPACING = 0.95;
const rubikTurn = { cycle: -1, axis: 0, layer: 0, dir: 1, baked: false };

function buildRubik(): Built {
  const polys: Poly[] = [];
  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        const cx = ix * SPACING;
        const cy = iy * SPACING;
        const cz = iz * SPACING;
        const sq = (y: number): P3[] => [
          [cx - CUBIE, y, cz - CUBIE],
          [cx + CUBIE, y, cz - CUBIE],
          [cx + CUBIE, y, cz + CUBIE],
          [cx - CUBIE, y, cz + CUBIE],
        ];
        polys.push({ pts: sq(cy - CUBIE), closed: true });
        polys.push({ pts: sq(cy + CUBIE), closed: true });
        for (const [sx, sz] of [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]) {
          polys.push({
            pts: [
              [cx + sx * CUBIE, cy - CUBIE, cz + sz * CUBIE],
              [cx + sx * CUBIE, cy + CUBIE, cz + sz * CUBIE],
            ],
          });
        }
      }
    }
  }

  const { pos, edges } = resamplePolys(polys, N);
  const col = new Float32Array(N3);
  const face = [C.red, C.orange, C.white, C.yellow, C.blue, C.green];
  for (let i = 0; i < N; i++) {
    const x = pos[i * 3];
    const y = pos[i * 3 + 1];
    const z = pos[i * 3 + 2];
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const az = Math.abs(z);
    const m = Math.max(ax, ay, az);
    const idx = m === ax ? (x > 0 ? 0 : 1) : m === ay ? (y > 0 ? 2 : 3) : z > 0 ? 4 : 5;
    put(col, i, face[idx], C.slate, m < 1.0 ? 0.55 : 0); // inner struts sit back
  }
  return { pos, col, edges: new Uint16Array(edges), aux: pos.slice() };
}

function liveRubik(out: Float32Array, b: Built, t: number) {
  const work = b.aux!; // settled state, mutated when a turn completes
  const TURN = 1.05;
  const CYCLE = 1.55;
  const cyc = Math.floor(t / CYCLE);

  if (cyc !== rubikTurn.cycle) {
    const rnd = mulberry32(cyc * 2654435761);
    rubikTurn.cycle = cyc;
    rubikTurn.axis = Math.floor(rnd() * 3);
    rubikTurn.layer = Math.floor(rnd() * 3) - 1;
    rubikTurn.dir = rnd() < 0.5 ? 1 : -1;
    rubikTurn.baked = false;
  }

  const prog = Math.min(1, (((t % CYCLE) + CYCLE) % CYCLE) / TURN);
  const ang = easeInOut(prog) * (Math.PI / 2) * rubikTurn.dir;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const { axis, layer } = rubikTurn;
  const bake = prog >= 1 && !rubikTurn.baked;

  for (let i = 0; i < N; i++) {
    const x = work[i * 3];
    const y = work[i * 3 + 1];
    const z = work[i * 3 + 2];
    const coord = axis === 0 ? x : axis === 1 ? y : z;
    const inLayer = Math.max(-1, Math.min(1, Math.round(coord / SPACING))) === layer;

    let nx = x;
    let ny = y;
    let nz = z;
    if (inLayer && !rubikTurn.baked) {
      if (axis === 0) {
        ny = y * ca - z * sa;
        nz = y * sa + z * ca;
      } else if (axis === 1) {
        nx = x * ca - z * sa;
        nz = x * sa + z * ca;
      } else {
        nx = x * ca - y * sa;
        ny = x * sa + y * ca;
      }
    }
    out[i * 3] = nx;
    out[i * 3 + 1] = ny;
    out[i * 3 + 2] = nz;
    if (bake) {
      work[i * 3] = nx;
      work[i * 3 + 1] = ny;
      work[i * 3 + 2] = nz;
    }
  }
  if (bake) rubikTurn.baked = true;
}

// ── 10. black hole eating two perpendicular discs ───────────────────────────
// Two accretion planes at exactly 90° to each other, each built as spiral
// streams whose matter slides down the arms and is swallowed at the centre.
const DISC_STREAMS = 20;
const DISC_PER = 35;
const DISC_PTS = DISC_STREAMS * DISC_PER; // 700 per disc
const PHOTON = 220;
const LENS = N - DISC_PTS * 2 - PHOTON; // 180
const R_IN = 0.78;
const R_OUT = 2.28;
const R_SPAN = R_OUT - R_IN;
const SPIRAL = 2.2;

type Plane = { u: THREE.Vector3; v: THREE.Vector3; n: THREE.Vector3 };

function basisFrom(n: THREE.Vector3): Plane {
  const nn = n.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nn);
  return {
    u: new THREE.Vector3(1, 0, 0).applyQuaternion(q),
    v: new THREE.Vector3(0, 0, 1).applyQuaternion(q),
    n: nn,
  };
}

// nA·nB = cosγ·(cosA·sinA − sinA·cosA) = 0 for any γ, so the planes are exactly
// perpendicular; γ just rolls the second one so neither ends up edge-on.
const A_TILT = 1.15;
const GAMMA = 0.22;
const PLANE_A = basisFrom(new THREE.Vector3(0, Math.cos(A_TILT), Math.sin(A_TILT)));
const PLANE_B = basisFrom(
  new THREE.Vector3(
    Math.sin(GAMMA),
    Math.cos(GAMMA) * Math.sin(A_TILT),
    -Math.cos(GAMMA) * Math.cos(A_TILT),
  ),
);

function discPlace(out: Float32Array, i: number, plane: Plane, r: number, th: number, lift: number) {
  const a = Math.cos(th) * r;
  const b = Math.sin(th) * r;
  out[i * 3] = plane.u.x * a + plane.v.x * b + plane.n.x * lift;
  out[i * 3 + 1] = plane.u.y * a + plane.v.y * b + plane.n.y * lift;
  out[i * 3 + 2] = plane.u.z * a + plane.v.z * b + plane.n.z * lift;
}

// radius at time t, sliding inward and wrapping back out to the rim
function infallR(r0: number, rate: number, t: number) {
  let f = (r0 - R_IN - t * rate) % R_SPAN;
  if (f < 0) f += R_SPAN;
  return R_IN + f;
}
// fade in at the rim, fade out as it is swallowed — no popping at the wrap
// clamped: the radial jitter can seed a point a hair outside [R_IN, R_OUT],
// and a negative colour would subtract light under additive blending
const infallFade = (r: number) => clamp01((r - R_IN) / 0.3) * clamp01((R_OUT - r) / 0.4);

// matter slides along a fixed spiral arm rather than winding up forever, so
// the disc keeps its structure however long it is on screen
const discAngle = (th0: number, r: number, omega: number, t: number) =>
  th0 + SPIRAL * (r - R_IN) + t * omega;

function buildBlackHole(): Built {
  const pos = new Float32Array(N3);
  const col = new Float32Array(N3);
  const aux = new Float32Array(N * 5); // [r0, theta0, kind, rate, omega]
  const edges: number[] = [];
  const rnd = mulberry32(6);

  const disc = (start: number, kind: number, plane: Plane, dir: number) => {
    for (let sIdx = 0; sIdx < DISC_STREAMS; sIdx++) {
      const th0 = (sIdx / DISC_STREAMS) * Math.PI * 2;
      const rate = 0.1 + rnd() * 0.08;
      const omega = dir * (0.24 + rnd() * 0.12);
      for (let k = 0; k < DISC_PER; k++) {
        const i = start + sIdx * DISC_PER + k;
        const r0 = R_IN + (k / (DISC_PER - 1)) * R_SPAN + (rnd() - 0.5) * 0.05;
        const jitter = (rnd() - 0.5) * 0.07;
        aux[i * 5] = r0;
        aux[i * 5 + 1] = th0 + jitter;
        aux[i * 5 + 2] = kind;
        aux[i * 5 + 3] = rate;
        aux[i * 5 + 4] = omega;
        discPlace(pos, i, plane, r0, discAngle(th0 + jitter, r0, omega, 0), (rnd() - 0.5) * 0.06);
        put(col, i, C.white, kind === 0 ? C.orange : C.cyan, clamp01((r0 - R_IN) / 1.3));
        scaleCol(col, i, infallFade(r0));
      }
    }
  };
  // counter-rotating, and warm against cool, so the two planes never read as one
  disc(0, 0, PLANE_A, 1);
  disc(DISC_PTS, 1, PLANE_B, -1);

  // photon ring: faces the camera, marking the shadow of the hole
  for (let k = 0; k < PHOTON; k++) {
    const i = DISC_PTS * 2 + k;
    const th = (k / PHOTON) * Math.PI * 2;
    aux[i * 5] = 0.7;
    aux[i * 5 + 1] = th;
    aux[i * 5 + 2] = 2;
    pos[i * 3] = Math.cos(th) * 0.7;
    pos[i * 3 + 1] = Math.sin(th) * 0.7;
    pos[i * 3 + 2] = 0;
    put(col, i, C.white);
    if (k < PHOTON - 1) edges.push(i, i + 1);
  }
  edges.push(DISC_PTS * 2 + PHOTON - 1, DISC_PTS * 2);

  // the lensed image, arcing over the shadow instead of behind it
  for (let k = 0; k < LENS; k++) {
    const i = DISC_PTS * 2 + PHOTON + k;
    const th = (k / LENS) * Math.PI * 2;
    const r = 0.95 + 0.15 * Math.sin(th * 2);
    aux[i * 5] = r;
    aux[i * 5 + 1] = th;
    aux[i * 5 + 2] = 3;
    pos[i * 3] = Math.cos(th) * r;
    pos[i * 3 + 1] = Math.sin(th) * r;
    pos[i * 3 + 2] = 0;
    put(col, i, C.cream, C.orange, 0.4);
  }
  return { pos, col, edges: new Uint16Array(edges), aux };
}

function liveBlackHole(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  for (let i = 0; i < N; i++) {
    const kind = aux[i * 5 + 2];
    const th0 = aux[i * 5 + 1];
    if (kind === 2) {
      out[i * 3] = Math.cos(th0) * 0.7;
      out[i * 3 + 1] = Math.sin(th0) * 0.7;
      out[i * 3 + 2] = 0;
      continue;
    }
    if (kind === 3) {
      const th = th0 + t * 0.25;
      const r = 0.95 + 0.15 * Math.sin(th * 2 + t);
      out[i * 3] = Math.cos(th) * r;
      out[i * 3 + 1] = Math.sin(th) * r;
      out[i * 3 + 2] = 0;
      continue;
    }
    const r = infallR(aux[i * 5], aux[i * 5 + 3], t);
    const th = discAngle(th0, r, aux[i * 5 + 4], t);
    discPlace(out, i, kind === 0 ? PLANE_A : PLANE_B, r, th, Math.sin(th * 3 + r * 9) * 0.04);
  }
}

function liveBlackHoleCol(out: Float32Array, b: Built, t: number) {
  const aux = b.aux!;
  for (let i = 0; i < N; i++) {
    const kind = aux[i * 5 + 2];
    if (kind === 2) {
      put(out, i, C.white);
      scaleCol(out, i, 1.1 + 0.2 * Math.sin(t * 3));
      continue;
    }
    if (kind === 3) {
      put(out, i, C.cream, C.orange, 0.4);
      scaleCol(out, i, 0.8);
      continue;
    }
    const r = infallR(aux[i * 5], aux[i * 5 + 3], t);
    const th = discAngle(aux[i * 5 + 1], r, aux[i * 5 + 4], t);
    // relativistic beaming: the side coming toward you is far brighter
    const beam = 0.4 + Math.pow((Math.cos(th) + 1) / 2, 1.6) * 1.4;
    // and it heats up on the way down
    put(out, i, C.white, kind === 0 ? C.orange : C.cyan, clamp01((r - R_IN) / 1.3));
    scaleCol(out, i, beam * infallFade(r));
  }
}

// ── registry ────────────────────────────────────────────────────────────────
export const SHAPES: Shape[] = [
  { id: "orb", label: "Constellation", accent: "#818cf8", spin: { x: 0.05, y: 0.13 }, build: buildSphere },
  { id: "leaves", label: "Foliage", accent: "#34d399", spin: { x: 0.04, y: 0.16 }, build: buildLeaves, live: liveLeaves },
  { id: "pyramid", label: "Monolith", accent: "#fb923c", spin: { sx: 0.16, y: 0.2, sp: 0.3 }, build: buildPyramid },
  { id: "terrain", label: "Terrain", accent: "#4ade80", spin: { sx: 0.08, sy: 0.09, sp: 0.21 }, build: buildTerrain, live: liveTerrain, liveCol: liveTerrainCol },
  { id: "galaxy", label: "Galaxy", accent: "#a78bfa", spin: { sx: 0.11, sy: 0.24, sp: 0.17 }, build: buildGalaxy, live: liveGalaxy },
  { id: "helix", label: "Helix", accent: "#22d3ee", spin: { sx: 0.18, y: 0.12, sp: 0.22 }, build: buildHelix, live: liveHelix, liveCol: liveHelixCol },
  { id: "knot", label: "Knot", accent: "#f472b6", spin: { x: 0.09, y: 0.15 }, build: buildKnot, live: liveKnot, liveCol: liveKnotCol },
  { id: "klein", label: "Klein Bottle", accent: "#fb7185", spin: { x: 0.05, y: 0.16 }, build: buildKlein, liveCol: liveKleinCol },
  { id: "rubik", label: "Cube", accent: "#facc15", spin: { x: 0.05, y: 0.18 }, build: buildRubik, live: liveRubik },
  { id: "blackhole", label: "Singularity", accent: "#fbbf24", spin: { sx: 0.12, sy: 0.2, sp: 0.16 }, build: buildBlackHole, live: liveBlackHole, liveCol: liveBlackHoleCol },
];

// ── transition flavours ─────────────────────────────────────────────────────
export type MorphMode = "vortex" | "nova" | "shatter";
export const MODE_SECONDS: Record<MorphMode, number> = { vortex: 2.4, nova: 2.1, shatter: 1.8 };
