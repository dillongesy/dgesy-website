// Signal processing for the tuner: pitch detection, chord recognition, and a
// plucked-string synth for reference tones. Pure functions over Float32Arrays,
// no Web Audio, so `node scripts/tuner-smoke.cjs` can feed it synthetic
// guitar signals and check the answers. RUN THAT after touching this file.

import { QUALITIES, type Quality, chordPitchClasses, midiToFreq } from "./music";

// ── Pitch: McLeod Pitch Method ─────────────────────────────────────────────
//
// Plain autocorrelation loves octave errors on a guitar, whose low strings
// often have a stronger 2nd harmonic than fundamental. MPM normalises the
// autocorrelation (NSDF, -1..1) and takes the FIRST peak within K of the
// tallest, which is the fundamental's period rather than a harmonic's.

const K = 0.9;

export interface PitchEstimate {
  freq: number;
  /** Height of the chosen NSDF peak, 0..1. Above ~0.85 is a clean, periodic note. */
  clarity: number;
}

// Raw samples run through the anti-alias filter before the analysis window
// starts, so its start-up transient is gone by the time it matters.
const WARMUP = 512;

export class PitchDetector {
  /** Raw input samples consumed per detect() call (taken from the END of the buffer). */
  readonly rawWindow: number;
  private readonly factor: number;
  private readonly lp: number[] | null;
  private filtered: Float32Array;
  private readonly rate: number;
  private readonly minLag: number;
  private readonly maxLag: number;
  private readonly x: Float32Array;
  private readonly nsdf: Float32Array;

  constructor(sampleRate: number, minFreq: number, maxFreq: number) {
    // Work at ~16x the highest frequency of interest. A guitar's useful pitch
    // range tops out near 1.3 kHz, so at 48 kHz this halves the work (and
    // quarters it for bass) without hurting sub-cent precision.
    this.factor = Math.max(1, Math.floor(sampleRate / (maxFreq * 16)));
    this.rate = sampleRate / this.factor;
    this.maxLag = Math.ceil(this.rate / minFreq);
    this.minLag = Math.max(2, Math.floor(this.rate / maxFreq));
    // 2.5 periods of the lowest note: enough for its NSDF peak to be reliable.
    const n = Math.ceil(this.maxLag * 2.5);
    this.x = new Float32Array(n);
    this.nsdf = new Float32Array(this.maxLag + 2);
    this.rawWindow = n * this.factor + (this.factor > 1 ? WARMUP : 0);
    this.filtered = new Float32Array(this.rawWindow);
    // Decimating throws away everything above the new Nyquist, and anything
    // up there doesn't vanish - it folds back down as tones that aren't
    // harmonics of the note. A pluck's attack (and any amp distortion) is full
    // of it, and on bass it was enough to push readings 2 cents off or a whole
    // octave out. Two cascaded Butterworth biquads (-24 dB/oct) clear it first.
    this.lp = this.factor > 1 ? biquadLowpass(this.rate * 0.3, sampleRate) : null;
  }

  detect(raw: Float32Array): PitchEstimate | null {
    const { x, nsdf, factor, maxLag, lp } = this;
    const n = x.length;
    if (raw.length < this.rawWindow) return null;
    let src = raw;
    let off = raw.length - n * factor;
    if (lp) {
      const f = this.filtered;
      f.set(raw.subarray(raw.length - this.rawWindow));
      runBiquad(f, lp);
      runBiquad(f, lp);
      src = f;
      off = WARMUP;
    }

    // Decimate (boxcar average) and remove DC.
    let mean = 0;
    for (let i = 0; i < n; i++) {
      let s = 0;
      const base = off + i * factor;
      for (let k = 0; k < factor; k++) s += src[base + k];
      x[i] = s / factor;
      mean += x[i];
    }
    mean /= n;
    for (let i = 0; i < n; i++) x[i] -= mean;

    // NSDF(tau) = 2 r(tau) / m(tau), with m updated incrementally.
    let m = 0;
    for (let j = 0; j < n; j++) m += x[j] * x[j];
    m *= 2;
    for (let tau = 0; tau <= maxLag + 1; tau++) {
      let acf = 0;
      for (let j = 0; j < n - tau; j++) acf += x[j] * x[j + tau];
      nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
      m -= x[n - 1 - tau] * x[n - 1 - tau] + x[tau] * x[tau];
    }

    // Key maxima: the highest point of each positive lobe after the first
    // zero crossing (the lobe at tau=0 is the signal matching itself).
    const keys: number[] = [];
    let t = 1;
    while (t <= maxLag && nsdf[t] > 0) t++;
    let inLobe = false;
    let bestT = 0;
    for (; t <= maxLag; t++) {
      const v = nsdf[t];
      if (v > 0) {
        if (!inLobe) {
          inLobe = true;
          bestT = t;
        } else if (v > nsdf[bestT]) bestT = t;
      } else if (inLobe) {
        inLobe = false;
        keys.push(bestT);
      }
    }
    // A lobe still open at maxLag only counts if its peak is a real maximum.
    if (inLobe && bestT < maxLag) keys.push(bestT);

    const usable = keys.filter((k) => k >= this.minLag);
    if (usable.length === 0) return null;
    let top = 0;
    for (const k of usable) top = Math.max(top, nsdf[k]);
    const pick = usable.find((k) => nsdf[k] >= K * top)!;

    // Parabolic interpolation for a sub-sample period.
    const a = nsdf[pick - 1], b = nsdf[pick], c = nsdf[pick + 1];
    const denom = a - 2 * b + c;
    const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
    const period = pick + shift;
    const clarity = Math.min(1, b - 0.25 * (a - c) * shift);
    const freq = this.rate / period;
    if (!Number.isFinite(freq) || freq <= 0) return null;
    return { freq, clarity };
  }
}

/** RBJ cookbook low-pass, Q = 1/sqrt(2). Returns [b0, b1, b2, a1, a2], normalised. */
function biquadLowpass(cutoff: number, sampleRate: number): number[] {
  const w = (2 * Math.PI * cutoff) / sampleRate;
  const alpha = Math.sin(w) / Math.SQRT2;
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  const b1 = (1 - cos) / a0;
  return [b1 / 2, b1, b1 / 2, (-2 * cos) / a0, (1 - alpha) / a0];
}

function runBiquad(buf: Float32Array, [b0, b1, b2, a1, a2]: number[]) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x0 = buf[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    buf[i] = y0;
  }
}

export function rms(buf: Float32Array, from = 0, to = buf.length): number {
  let s = 0;
  for (let i = from; i < to; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / Math.max(1, to - from));
}

export const toDb = (amplitude: number) => (amplitude > 0 ? 20 * Math.log10(amplitude) : -Infinity);

// ── Chords: chroma from a spectrum, matched against templates ──────────────

const CHROMA_LOW = 40; // E2
const CHROMA_HIGH = 88; // E6

const BASS_HIGH = 59; // B3: the bass note of an open or low barre chord is below this

export interface Chroma {
  /** Pitch-class energy, C..B, max-normalised to 1. */
  pcs: Float32Array;
  /** Pitch class of the lowest strong note, or null. */
  bass: number | null;
}

/**
 * Pitch-class energy plus the bass note from a LINEAR magnitude spectrum.
 * Returns null when the spectrum is silent.
 */
export function chromaFromSpectrum(
  mag: Float32Array,
  binHz: number,
  a4 = 440,
  out: Float32Array = new Float32Array(12),
): Chroma | null {
  out.fill(0);
  const notes = new Float32Array(CHROMA_HIGH - CHROMA_LOW + 1);
  for (let midi = CHROMA_LOW; midi <= CHROMA_HIGH; midi++) {
    const f = midiToFreq(midi, a4);
    const lo = Math.max(0, Math.floor((f * 2 ** (-0.4 / 12)) / binHz));
    const hi = Math.min(mag.length - 1, Math.ceil((f * 2 ** (0.4 / 12)) / binHz));
    let peak = 0;
    for (let b = lo; b <= hi; b++) if (mag[b] > peak) peak = mag[b];
    // sqrt: a loud bass note shouldn't drown out the top strings.
    notes[midi - CHROMA_LOW] = Math.sqrt(peak);
    out[midi % 12] += notes[midi - CHROMA_LOW];
  }
  let max = 0;
  for (let i = 0; i < 12; i++) max = Math.max(max, out[i]);
  if (max <= 0) return null;
  for (let i = 0; i < 12; i++) out[i] /= max;

  // Bass: the lowest note in the bottom range that's a real peak, not leakage.
  let loudest = 0;
  for (let m = CHROMA_LOW; m <= BASS_HIGH; m++) loudest = Math.max(loudest, notes[m - CHROMA_LOW]);
  let bass: number | null = null;
  for (let m = CHROMA_LOW; m <= BASS_HIGH && loudest > 0; m++) {
    const v = notes[m - CHROMA_LOW];
    const prev = m > CHROMA_LOW ? notes[m - 1 - CHROMA_LOW] : 0;
    const next = notes[m + 1 - CHROMA_LOW];
    if (v >= BASS_FLOOR * loudest && v >= prev && v >= next) {
      bass = m % 12;
      break;
    }
  }
  return { pcs: out, bass };
}

// A plucked note doesn't only sound its own pitch class: its 3rd harmonic is
// the fifth above, the 5th is the major third, the 7th the minor seventh. So
// a C chord really sounds C, E, G plus G, B, D (their fifths) and so on. Rather
// than try to subtract that back out, each chord's template includes it - the
// usual trick in chord recognition, and it stops C from reading as Cadd9.
const OVERTONES: [number, number][] = [
  [0, 1],
  [7, 0.4],
  [4, 0.3],
  [10, 0.1],
];

function chordTemplate(root: number, quality: Quality): Float32Array {
  const t = new Float32Array(12);
  for (const pc of chordPitchClasses(root, quality))
    for (const [interval, weight] of OVERTONES) t[(pc + interval) % 12] += weight;
  let norm = 0;
  for (let i = 0; i < 12; i++) norm += t[i] * t[i];
  norm = Math.sqrt(norm);
  for (let i = 0; i < 12; i++) t[i] /= norm;
  return t;
}

const MATCH_QUALITIES = Object.keys(QUALITIES) as Quality[];
const TEMPLATES = Array.from({ length: 12 }, (_, root) =>
  MATCH_QUALITIES.map((quality) => ({ root, quality, t: chordTemplate(root, quality) })),
).flat();

export interface ChordGuess {
  root: number;
  quality: Quality;
  score: number;
}

/**
 * Every root x quality ranked best first: cosine similarity with the chroma,
 * plus a nudge toward the chord built on the bass note (Asus2 and Esus4 are the
 * same three notes - only the bass tells them apart) and toward simpler chords.
 */
export function rankChords({ pcs, bass }: Chroma): ChordGuess[] {
  let norm = 0;
  for (let i = 0; i < 12; i++) norm += pcs[i] * pcs[i];
  norm = Math.sqrt(norm) || 1;
  return TEMPLATES.map(({ root, quality, t }) => {
    let dot = 0;
    for (let i = 0; i < 12; i++) dot += pcs[i] * t[i];
    const prior = (root === bass ? BASS_BONUS : 0) - COMPLEXITY * (QUALITIES[quality].intervals.length - 3);
    return { root, quality, score: dot / norm + prior };
  }).sort((a, b) => b.score - a.score);
}

export interface ChordCheck {
  /** What it sounds like. Leans to the target when the target is a near-tie. */
  heard: ChordGuess;
  match: boolean;
  missing: number[];
  extra: number[];
}

/** Compare what was heard against the chord the player is practising. */
export function checkChord(chroma: Chroma, root: number, quality: Quality): ChordCheck {
  const ranked = rankChords(chroma);
  const target = ranked.find((g) => g.root === root && g.quality === quality)!;
  // Near-ties are normal (C vs Cmaj7, Em vs G6-ish voicings); give the player
  // the benefit of the doubt when what they're aiming for is that close.
  const heard = target.score >= ranked[0].score - TIE ? target : ranked[0];
  const tones = chordPitchClasses(root, quality);
  // Overtones of the chord's own notes aren't wrong notes.
  const explained = new Set(tones.flatMap((pc) => [pc, (pc + 7) % 12, (pc + 4) % 12]));
  const missing = tones.filter((pc) => chroma.pcs[pc] < MISSING);
  const extra: number[] = [];
  for (let pc = 0; pc < 12; pc++) if (!explained.has(pc) && chroma.pcs[pc] > EXTRA) extra.push(pc);
  return {
    heard,
    match: heard === target && missing.length === 0 && extra.length === 0,
    missing,
    extra,
  };
}

const TIE = 0.03;
const BASS_FLOOR = 0.45;
const BASS_BONUS = 0.03;
const COMPLEXITY = 0.008;
const MISSING = 0.25;
const EXTRA = 0.5;

// ── Synth: Karplus-Strong plucked string ───────────────────────────────────
//
// A noise burst circulating in a delay line one period long, low-passed each
// trip, sounds like a plucked string. The averaging filter adds half a sample
// of delay and an all-pass covers the fractional rest, so the pitch is exact
// (a reference tone that's 5 cents off would defeat the point).

export function pluck(freq: number, sampleRate: number, seconds = 2.5, seed = 1): Float32Array {
  const total = Math.floor(sampleRate * seconds);
  const out = new Float32Array(total);
  const loop = sampleRate / freq;
  const len = Math.max(2, Math.floor(loop - 0.6));
  const frac = loop - len - 0.5;
  const coef = (1 - frac) / (1 + frac);

  let s = seed >>> 0 || 1;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const ring = new Float32Array(len);
  let smooth = 0;
  for (let i = 0; i < len; i++) ring[i] = smooth = 0.6 * smooth + 0.4 * rand();
  let mean = 0;
  for (let i = 0; i < len; i++) mean += ring[i];
  mean /= len;
  for (let i = 0; i < len; i++) ring[i] -= mean;

  const decay = 0.998;
  let prev = 0, apX = 0, apY = 0, p = 0;
  for (let n = 0; n < total; n++) {
    const cur = ring[p];
    out[n] = cur;
    const lp = decay * 0.5 * (cur + prev);
    prev = cur;
    const ap = coef * lp + apX - coef * apY;
    apX = lp;
    apY = ap;
    ring[p] = ap;
    p = p + 1 === len ? 0 : p + 1;
  }
  // Fade the tail so the buffer doesn't end on a click.
  const fade = Math.min(total, Math.floor(sampleRate * 0.3));
  for (let i = 0; i < fade; i++) out[total - 1 - i] *= i / fade;
  return normalise(out, 0.6);
}

/** A down-strum: one pluck per note, each a little later than the last. */
export function strum(freqs: number[], sampleRate: number, seconds = 3, gapMs = 28): Float32Array {
  const total = Math.floor(sampleRate * seconds);
  const out = new Float32Array(total);
  freqs.forEach((f, i) => {
    const start = Math.floor((i * gapMs * sampleRate) / 1000);
    const note = pluck(f, sampleRate, seconds, i + 7);
    for (let n = 0; n + start < total; n++) out[n + start] += note[n];
  });
  return normalise(out, 0.7);
}

function normalise(buf: Float32Array, peak: number): Float32Array {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max > 0) for (let i = 0; i < buf.length; i++) buf[i] *= peak / max;
  return buf;
}

