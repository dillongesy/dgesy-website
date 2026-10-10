// Music theory and instrument data for the tuner. No React and no browser APIs
// on purpose, so `node scripts/tuner-smoke.cjs` can load it (via jiti) and
// check every tuning and chord shape.

export const NOTE_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const NOTE_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "Eb2" -> 39. Scientific pitch notation, so C4 is middle C and A4 is MIDI 69. */
export function parseNote(s: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
  if (!m) throw new Error(`Bad note: ${s}`);
  const accidental = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return LETTER[m[1]] + accidental + (Number(m[3]) + 1) * 12;
}

export const midiToFreq = (midi: number, a4 = 440) => a4 * 2 ** ((midi - 69) / 12);
export const freqToMidi = (freq: number, a4 = 440) => 69 + 12 * Math.log2(freq / a4);
export const cents = (freq: number, target: number) => 1200 * Math.log2(freq / target);

export const pitchClass = (midi: number) => ((Math.round(midi) % 12) + 12) % 12;
export const octaveOf = (midi: number) => Math.floor(Math.round(midi) / 12) - 1;
export const noteName = (midi: number, flats = false) =>
  (flats ? NOTE_FLAT : NOTE_SHARP)[pitchClass(midi)];

// ── Instruments and tunings ────────────────────────────────────────────────

export type Family = "guitar" | "bass" | "ukulele";
export type InstrumentId = "electric" | "acoustic" | "classical" | "bass" | "ukulele";

export interface Instrument {
  id: InstrumentId;
  label: string;
  family: Family;
  stringCounts: number[];
}

export const INSTRUMENTS: Instrument[] = [
  { id: "electric", label: "Electric", family: "guitar", stringCounts: [6, 7, 8] },
  { id: "acoustic", label: "Acoustic", family: "guitar", stringCounts: [6] },
  { id: "classical", label: "Classical", family: "guitar", stringCounts: [6] },
  { id: "bass", label: "Bass", family: "bass", stringCounts: [4, 5, 6] },
  { id: "ukulele", label: "Ukulele", family: "ukulele", stringCounts: [4] },
];

export interface Tuning {
  id: string;
  name: string;
  /** Thickest (lowest-numbered-position) string first, the way you look down at the neck. */
  notes: string[];
  flats?: boolean;
}

export const TUNINGS: Record<string, Tuning[]> = {
  "guitar-6": [
    { id: "standard", name: "Standard (E A D G B E)", notes: ["E2", "A2", "D3", "G3", "B3", "E4"] },
    { id: "eb", name: "Half step down (Eb)", notes: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"], flats: true },
    { id: "drop-d", name: "Drop D", notes: ["D2", "A2", "D3", "G3", "B3", "E4"] },
    { id: "d-standard", name: "D Standard", notes: ["D2", "G2", "C3", "F3", "A3", "D4"] },
    { id: "drop-c", name: "Drop C", notes: ["C2", "G2", "C3", "F3", "A3", "D4"] },
    { id: "c-standard", name: "C Standard", notes: ["C2", "F2", "Bb2", "Eb3", "G3", "C4"], flats: true },
    { id: "open-g", name: "Open G", notes: ["D2", "G2", "D3", "G3", "B3", "D4"] },
    { id: "open-d", name: "Open D", notes: ["D2", "A2", "D3", "F#3", "A3", "D4"] },
    { id: "open-e", name: "Open E", notes: ["E2", "B2", "E3", "G#3", "B3", "E4"] },
    { id: "dadgad", name: "DADGAD", notes: ["D2", "A2", "D3", "G3", "A3", "D4"] },
  ],
  "guitar-7": [
    { id: "standard", name: "Standard (B E A D G B E)", notes: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"] },
    { id: "drop-a", name: "Drop A", notes: ["A1", "E2", "A2", "D3", "G3", "B3", "E4"] },
    { id: "a-standard", name: "A Standard", notes: ["A1", "D2", "G2", "C3", "F3", "A3", "D4"] },
  ],
  "guitar-8": [
    { id: "standard", name: "Standard (F# B E A D G B E)", notes: ["F#1", "B1", "E2", "A2", "D3", "G3", "B3", "E4"] },
    { id: "drop-e", name: "Drop E", notes: ["E1", "B1", "E2", "A2", "D3", "G3", "B3", "E4"] },
  ],
  "bass-4": [
    { id: "standard", name: "Standard (E A D G)", notes: ["E1", "A1", "D2", "G2"] },
    { id: "eb", name: "Half step down (Eb)", notes: ["Eb1", "Ab1", "Db2", "Gb2"], flats: true },
    { id: "drop-d", name: "Drop D", notes: ["D1", "A1", "D2", "G2"] },
  ],
  "bass-5": [
    { id: "standard", name: "Standard (B E A D G)", notes: ["B0", "E1", "A1", "D2", "G2"] },
    { id: "high-c", name: "High C (E A D G C)", notes: ["E1", "A1", "D2", "G2", "C3"] },
  ],
  "bass-6": [
    { id: "standard", name: "Standard (B E A D G C)", notes: ["B0", "E1", "A1", "D2", "G2", "C3"] },
  ],
  "ukulele-4": [
    { id: "standard", name: "Standard (G C E A)", notes: ["G4", "C4", "E4", "A4"] },
    { id: "low-g", name: "Low G", notes: ["G3", "C4", "E4", "A4"] },
    { id: "baritone", name: "Baritone (D G B E)", notes: ["D3", "G3", "B3", "E4"] },
  ],
};

export const instrumentById = (id: InstrumentId) => INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];

export function tuningsFor(instrument: InstrumentId, strings: number): Tuning[] {
  return TUNINGS[`${instrumentById(instrument).family}-${strings}`] ?? TUNINGS["guitar-6"];
}

export interface GuitarString {
  /** 1 = the thinnest string, as guitarists count them. */
  number: number;
  midi: number;
  name: string;
  octave: number;
}

export function stringsOf(tuning: Tuning): GuitarString[] {
  return tuning.notes.map((n, i) => {
    const midi = parseNote(n);
    return {
      number: tuning.notes.length - i,
      midi,
      name: noteName(midi, tuning.flats),
      octave: octaveOf(midi),
    };
  });
}

/**
 * The frequency window the pitch detector searches for an instrument/tuning:
 * five semitones under the lowest string (a slack string still reads), up to
 * two octaves over the highest (fretted notes in chromatic mode).
 */
export function detectionRange(tuning: Tuning, a4 = 440) {
  const midis = tuning.notes.map(parseNote);
  return {
    minFreq: midiToFreq(Math.min(...midis) - 5, a4),
    maxFreq: midiToFreq(Math.max(...midis) + 24, a4),
  };
}

// ── Chords ─────────────────────────────────────────────────────────────────

export type Quality = "maj" | "min" | "7" | "maj7" | "m7" | "sus2" | "sus4" | "add9" | "5";

export const QUALITIES: Record<Quality, { suffix: string; intervals: number[] }> = {
  maj: { suffix: "", intervals: [0, 4, 7] },
  min: { suffix: "m", intervals: [0, 3, 7] },
  "7": { suffix: "7", intervals: [0, 4, 7, 10] },
  maj7: { suffix: "maj7", intervals: [0, 4, 7, 11] },
  m7: { suffix: "m7", intervals: [0, 3, 7, 10] },
  sus2: { suffix: "sus2", intervals: [0, 2, 7] },
  sus4: { suffix: "sus4", intervals: [0, 5, 7] },
  add9: { suffix: "add9", intervals: [0, 2, 4, 7] },
  "5": { suffix: "5", intervals: [0, 7] },
};

export const chordPitchClasses = (root: number, quality: Quality) =>
  QUALITIES[quality].intervals.map((i) => (root + i) % 12);

/** Flat spellings for the roots guitarists usually write flat. */
const FLAT_ROOTS = new Set([1, 3, 8, 10]);
export const chordLabel = (root: number, quality: Quality) =>
  (FLAT_ROOTS.has(root) ? NOTE_FLAT : NOTE_SHARP)[root] + QUALITIES[quality].suffix;

export interface ChordShape {
  root: number;
  quality: Quality;
  group: string;
  /** Low E string first. -1 = muted, 0 = open. */
  frets: number[];
  /** 0 = no finger (open/muted), 1-4 = index..pinky. */
  fingers: number[];
  /** String indices (low E = 0), inclusive. */
  barre?: { fret: number; from: number; to: number };
}

export const STANDARD_6 = TUNINGS["guitar-6"][0];

const C = 0, D = 2, E = 4, F = 5, Fs = 6, G = 7, A = 9, Bb = 10, B = 11;

export const CHORDS: ChordShape[] = [
  // Open major
  { root: C, quality: "maj", group: "Major", frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  { root: D, quality: "maj", group: "Major", frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  { root: E, quality: "maj", group: "Major", frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { root: G, quality: "maj", group: "Major", frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  { root: A, quality: "maj", group: "Major", frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  // Open minor
  { root: A, quality: "min", group: "Minor", frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  { root: E, quality: "min", group: "Minor", frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { root: D, quality: "min", group: "Minor", frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  // Sevenths
  { root: E, quality: "7", group: "Seventh", frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  { root: A, quality: "7", group: "Seventh", frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  { root: D, quality: "7", group: "Seventh", frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  { root: G, quality: "7", group: "Seventh", frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  { root: C, quality: "7", group: "Seventh", frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  { root: B, quality: "7", group: "Seventh", frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  { root: A, quality: "m7", group: "Seventh", frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  { root: E, quality: "m7", group: "Seventh", frets: [0, 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0] },
  { root: D, quality: "m7", group: "Seventh", frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], barre: { fret: 1, from: 4, to: 5 } },
  { root: C, quality: "maj7", group: "Seventh", frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  { root: F, quality: "maj7", group: "Seventh", frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  // Sus and add
  { root: D, quality: "sus2", group: "Sus & add", frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  { root: D, quality: "sus4", group: "Sus & add", frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  { root: A, quality: "sus2", group: "Sus & add", frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  { root: A, quality: "sus4", group: "Sus & add", frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { root: E, quality: "sus4", group: "Sus & add", frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  { root: C, quality: "add9", group: "Sus & add", frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
  // Barre
  { root: F, quality: "maj", group: "Barre", frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  { root: Bb, quality: "maj", group: "Barre", frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, from: 1, to: 5 } },
  { root: B, quality: "min", group: "Barre", frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 1, to: 5 } },
  { root: Fs, quality: "min", group: "Barre", frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 2, from: 0, to: 5 } },
  // Power
  { root: E, quality: "5", group: "Power", frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  { root: A, quality: "5", group: "Power", frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0] },
  { root: G, quality: "5", group: "Power", frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
];

export const CHORD_GROUPS = [...new Set(CHORDS.map((c) => c.group))];

export const shapeLabel = (s: ChordShape) => chordLabel(s.root, s.quality);

/** MIDI note of each string in a shape (null where muted), in standard tuning. */
export function shapeMidis(shape: ChordShape, tuning: Tuning = STANDARD_6): (number | null)[] {
  return shape.frets.map((f, i) => (f < 0 ? null : parseNote(tuning.notes[i]) + f));
}
