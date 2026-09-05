const path = require("path");
const root = path.join(__dirname, "..");
const createJiti = require(path.join(root, "node_modules/jiti")).createJiti;
const jiti = createJiti(__filename, { interopDefault: true });
const mod = jiti(path.join(root, "app/components/orbShapes.ts"));
const { SHAPES, N } = mod;

let fail = 0;
const check = (label, arr, len, max) => {
  if (!arr) return console.log(`  ${label}: MISSING`), fail++;
  if (arr.length !== len) { console.log(`  ${label}: length ${arr.length} != ${len}`); fail++; }
  let bad = 0, big = 0, lo = Infinity, hi = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (!Number.isFinite(v)) bad++;
    if (max != null && Math.abs(v) > max) big++;
    if (v < lo) lo = v; if (v > hi) hi = v;
  }
  if (bad) { console.log(`  ${label}: ${bad} non-finite`); fail++; }
  return { bad, big, lo, hi };
};

const out = new Float32Array(N * 3);
const outCol = new Float32Array(N * 3);

for (const s of SHAPES) {
  const b = s.build();
  process.stdout.write(s.id.padEnd(11));
  const p = check("pos", b.pos, N * 3);
  check("col", b.col, N * 3);
  // extent from origin
  let rmax = 0;
  for (let i = 0; i < N; i++) rmax = Math.max(rmax, Math.hypot(b.pos[i*3], b.pos[i*3+1], b.pos[i*3+2]));
  // widest projected radius under any Y rotation = max sqrt(x^2+z^2) combined with |y|
  let xz = 0, ay = 0;
  for (let i = 0; i < N; i++) { xz = Math.max(xz, Math.hypot(b.pos[i*3], b.pos[i*3+2])); ay = Math.max(ay, Math.abs(b.pos[i*3+1])); }
  let emax = -1;
  for (let i = 0; i < b.edges.length; i++) emax = Math.max(emax, b.edges[i]);
  if (emax >= N) { console.log(`  ${s.id}: edge index ${emax} out of range`); fail++; }
  if (b.edges.length % 2) { console.log(`  ${s.id}: odd edge count`); fail++; }
  let colBad = 0;
  for (let i = 0; i < b.col.length; i++) if (b.col[i] < 0 || b.col[i] > 4) colBad++;
  if (colBad) { console.log(`  ${s.id}: ${colBad} colour channels out of range`); fail++; }

  // run live()/liveCol() over a spread of times
  let liveBad = 0, colLiveBad = 0, liveMax = 0;
  for (let t = 0; t < 40; t++) {
    const time = t * 0.37;
    if (s.live) {
      s.live(out, b, time, 1 / 60);
      for (let i = 0; i < N * 3; i++) if (!Number.isFinite(out[i])) liveBad++;
      for (let i = 0; i < N; i++) liveMax = Math.max(liveMax, Math.hypot(out[i*3], out[i*3+2]));
    }
    if (s.liveCol) {
      s.liveCol(outCol, b, time);
      for (let i = 0; i < N * 3; i++) if (!Number.isFinite(outCol[i]) || outCol[i] < 0) colLiveBad++;
    }
  }
  if (liveBad) { console.log(`  ${s.id}: live() produced ${liveBad} non-finite`); fail++; }
  if (colLiveBad) { console.log(`  ${s.id}: liveCol() produced ${colLiveBad} bad values`); fail++; }
  console.log(
    `pts=${b.pos.length/3} edges=${b.edges.length/2} rmax=${rmax.toFixed(2)} xz=${xz.toFixed(2)} |y|=${ay.toFixed(2)}` +
    (s.live ? ` liveXZ=${liveMax.toFixed(2)}` : "") + (colBad ? ` COLBAD=${colBad}` : "")
  );
}
console.log(fail ? `\nFAILURES: ${fail}` : "\nall shapes ok");
