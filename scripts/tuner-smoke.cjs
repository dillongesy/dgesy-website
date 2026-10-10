// Checks the tuner's music data and DSP against synthetic signals:
//   node scripts/tuner-smoke.cjs
// Every tuning parses, every chord shape plays the chord it claims to, the
// pitch detector is accurate (and doesn't jump octaves) on every string of
// every tuning, and every chord shape is recognised when strummed.
const path = require("path");
const root = path.join(__dirname, "..");
const createJiti = require(path.join(root, "node_modules/jiti")).createJiti;
const jiti = createJiti(__filename, { interopDefault: true });
const music = jiti(path.join(root, "app/components/tuner/music.ts"));
const dsp = jiti(path.join(root, "app/components/tuner/dsp.ts"));

let fail = 0;
const bad = (msg) => { console.log("  FAIL " + msg); fail++; };

// ── Data ──
for (const [key, list] of Object.entries(music.TUNINGS)) {
  const count = Number(key.split("-")[1]);
  for (const t of list) {
    if (t.notes.length !== count) bad(`${key}/${t.id}: ${t.notes.length} notes`);
    music.stringsOf(t); // throws on a bad note
  }
}
for (const inst of music.INSTRUMENTS)
  for (const n of inst.stringCounts)
    if (!music.TUNINGS[`${inst.family}-${n}`]) bad(`no tunings for ${inst.id} ${n}`);

for (const shape of music.CHORDS) {
  const label = music.shapeLabel(shape);
  if (shape.frets.length !== 6 || shape.fingers.length !== 6) bad(`${label}: needs 6 strings`);
  const played = new Set(music.shapeMidis(shape).filter((m) => m != null).map(music.pitchClass));
  const want = music.chordPitchClasses(shape.root, shape.quality);
  for (const pc of played) if (!want.includes(pc)) bad(`${label}: plays non-chord tone ${music.NOTE_SHARP[pc]}`);
  const fifth = (shape.root + 7) % 12;
  for (const pc of want) if (!played.has(pc) && pc !== fifth) bad(`${label}: missing ${music.NOTE_SHARP[pc]}`);
  shape.frets.forEach((f, i) => {
    if ((f > 0) !== (shape.fingers[i] > 0)) bad(`${label}: string ${i} fret/finger mismatch`);
  });
}
console.log(`data       ${Object.values(music.TUNINGS).flat().length} tunings, ${music.CHORDS.length} chord shapes`);

// ── Pitch ──
const sine = (f, sr, n, harmonics = [1]) => {
  const out = new Float32Array(n);
  const phase = harmonics.map((_, h) => h * 1.3);
  for (let i = 0; i < n; i++) {
    let v = 0;
    harmonics.forEach((a, h) => (v += a * Math.sin((2 * Math.PI * f * (h + 1) * i) / sr + phase[h])));
    out[i] = 0.3 * v;
  }
  return out;
};
const FFT_SIZE = 8192; // what the AnalyserNode hands the detector
let worst = { sine: 0, harm: 0, pluck: 0, detuned: 0 }, count = 0;
for (const sr of [44100, 48000]) {
  for (const [key, list] of Object.entries(music.TUNINGS)) {
    for (const tuning of list) {
      const { minFreq, maxFreq } = music.detectionRange(tuning);
      const det = new dsp.PitchDetector(sr, minFreq, maxFreq);
      if (det.rawWindow > FFT_SIZE) bad(`${key}/${tuning.id}: window ${det.rawWindow} > ${FFT_SIZE}`);
      for (const s of music.stringsOf(tuning)) {
        const f = music.midiToFreq(s.midi);
        const check = (kind, sig, target, tol) => {
          const est = det.detect(sig.subarray(0, Math.min(sig.length, Math.floor(sr * 0.25))));
          count++;
          if (!est) return bad(`${sr} ${key}/${tuning.id} ${s.name}${s.octave} ${kind}: no pitch`);
          const c = music.cents(est.freq, target);
          worst[kind] = Math.max(worst[kind], Math.abs(c));
          if (Math.abs(c) > tol) bad(`${sr} ${key}/${tuning.id} ${s.name}${s.octave} ${kind}: ${c.toFixed(2)}c (clarity ${est.clarity.toFixed(2)})`);
          if (est.clarity < 0.85) bad(`${sr} ${key}/${tuning.id} ${s.name}${s.octave} ${kind}: clarity ${est.clarity.toFixed(2)}`);
        };
        check("sine", sine(f, sr, sr), f, 0.5);
        // Weak fundamental, strong 2nd harmonic: the classic octave-error trap.
        check("harm", sine(f, sr, sr, [0.35, 1, 0.6, 0.4, 0.25, 0.15]), f, 1);
        check("pluck", dsp.pluck(f, sr, 1), f, 1);
        const off = f * 2 ** (-23 / 1200);
        check("detuned", sine(off, sr, sr, [1, 0.5, 0.3]), off, 0.5);
      }
    }
  }
}
const noise = new Float32Array(FFT_SIZE).map(() => Math.random() * 2 - 1);
const gdet = new dsp.PitchDetector(48000, 60, 1400);
if (gdet.detect(new Float32Array(FFT_SIZE)) !== null) bad("silence produced a pitch");
const nz = gdet.detect(noise);
if (nz && nz.clarity > 0.85) bad(`white noise read as a clean pitch (${nz.freq.toFixed(1)} Hz)`);
console.log(`pitch      ${count} checks, worst cents: ` +
  Object.entries(worst).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(", "));

// ── Chords ──
function fftMag(sig) {
  const n = sig.length, re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    // Blackman, as the AnalyserNode uses
    const w = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / n) + 0.08 * Math.cos((4 * Math.PI * i) / n);
    re[i] = sig[i] * w;
  }
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  const mag = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]) / n;
  return mag;
}
const SR = 48000, SPEC = 16384;
// Two voices: the bright Karplus-Strong pluck, and a darker additive tone
// (closer to a neck pickup), so the matcher isn't tuned to one timbre.
const darkStrum = (freqs) => {
  const out = new Float32Array(SR);
  freqs.forEach((f, k) => {
    const start = Math.floor(k * 0.028 * SR);
    for (let i = start; i < SR; i++) {
      const t = (i - start) / SR, env = Math.exp(-t * 2.5);
      let v = 0;
      [1, 0.6, 0.35, 0.2, 0.12, 0.07].forEach((a, h) => (v += a * Math.sin(2 * Math.PI * f * (h + 1) * t + h)));
      out[i] += env * v;
    }
  });
  return out;
};
let chordOk = 0, chordRuns = 0;
for (const [voice, make] of [["pluck", (f) => dsp.strum(f, SR, 1)], ["dark", darkStrum]])
for (const shape of music.CHORDS) {
  chordRuns++;
  const label = voice + " " + music.shapeLabel(shape);
  const freqs = music.shapeMidis(shape).filter((m) => m != null).map((m) => music.midiToFreq(m));
  const sig = make(freqs);
  const start = Math.floor(SR * 0.2);
  const mag = fftMag(sig.subarray(start, start + SPEC));
  const chroma = dsp.chromaFromSpectrum(mag, SR / SPEC);
  if (!chroma) { bad(`${label}: silent chroma`); continue; }
  const res = dsp.checkChord(chroma, shape.root, shape.quality);
  if (!res.match) {
    const heard = music.chordLabel(res.heard.root, res.heard.quality);
    bad(`${label}: heard ${heard} (${res.heard.score.toFixed(2)}), missing [${res.missing.map((p) => music.NOTE_SHARP[p])}] extra [${res.extra.map((p) => music.NOTE_SHARP[p])}] bass ${chroma.bass} chroma ${Array.from(chroma.pcs, (v) => v.toFixed(2)).join(" ")}`);
  } else chordOk++;
  // ...and a wrong chord must not pass as this one.
  const other = music.CHORDS.find((c) => c.root !== shape.root && c.quality === shape.quality && c.group === shape.group)
    ?? music.CHORDS.find((c) => c.root !== shape.root);
  const wrong = dsp.checkChord(chroma, other.root, other.quality);
  if (wrong.match) bad(`${label} strummed was accepted as ${music.shapeLabel(other)}`);
}
console.log(`chords     ${chordOk}/${chordRuns} recognised when strummed (2 voices)`);

console.log(fail ? `\n${fail} FAILURES` : "\nall tuner checks ok");
process.exit(fail ? 1 : 0);
