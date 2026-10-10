"use client";

import { CheckCircle2, Play } from "lucide-react";
import ChordDiagram from "./ChordDiagram";
import { type Chroma, checkChord, strum } from "./dsp";
import {
  CHORDS,
  CHORD_GROUPS,
  NOTE_FLAT,
  NOTE_SHARP,
  chordLabel,
  chordPitchClasses,
  midiToFreq,
  shapeLabel,
  shapeMidis,
} from "./music";
import { playSamples } from "./useAudioInput";

interface Props {
  chord: number;
  onChord: (i: number) => void;
  chroma: Chroma | null;
  running: boolean;
  /** Diagrams are standard-tuning fingerings; warn when the tuner is set to something else. */
  standardTuning: boolean;
  a4: number;
}

export default function ChordTrainer({ chord, onChord, chroma, running, standardTuning, a4 }: Props) {
  const shape = CHORDS[chord] ?? CHORDS[0];
  const label = shapeLabel(shape);
  const flats = [1, 3, 8, 10].includes(shape.root);
  const names = flats ? NOTE_FLAT : NOTE_SHARP;
  const tones = chordPitchClasses(shape.root, shape.quality);
  const check = chroma ? checkChord(chroma, shape.root, shape.quality) : null;
  const heard = chroma ? new Set(tones.filter((pc) => chroma.pcs[pc] >= 0.25)) : undefined;

  const play = () => {
    const freqs = shapeMidis(shape)
      .filter((m): m is number => m != null)
      .map((m) => midiToFreq(m, a4));
    playSamples((sr) => strum(freqs, sr, 3));
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Diagram + verdict */}
      <div className="flex flex-col items-center">
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl font-black tracking-tight text-white">{label}</h3>
          <span className="font-mono text-xs text-slate-500">{tones.map((pc) => names[pc]).join(" · ")}</span>
        </div>
        <ChordDiagram shape={shape} heard={heard} />
        <button
          type="button"
          onClick={play}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300 transition-colors"
        >
          <Play size={12} fill="currentColor" /> Hear it
        </button>
        {!standardTuning && (
          <p className="mt-3 text-center text-[11px] text-amber-300/80">
            Fingerings are for standard tuning - your tuner is set to something else.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        {/* Live verdict */}
        <div className="rounded-xl border border-white/[0.07] bg-black/30 p-4" aria-live="polite">
          {!running ? (
            <p className="text-sm text-slate-400">Press <span className="text-emerald-300">Start</span>, then strum the chord - it&apos;ll tell you what it hears.</p>
          ) : !check ? (
            <p className="text-sm text-slate-400">Strum the chord and let it ring...</p>
          ) : check.match ? (
            <p className="flex items-center gap-2 text-lg font-semibold text-emerald-300">
              <CheckCircle2 size={20} /> That&apos;s {label}!
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-300">
                {check.heard.root === shape.root && check.heard.quality === shape.quality ? (
                  <span className="font-semibold text-amber-300">Almost {label}</span>
                ) : (
                  <>
                    Sounds like{" "}
                    <span className="font-semibold text-amber-300">{chordLabel(check.heard.root, check.heard.quality)}</span>
                  </>
                )}
              </p>
              {check.missing.length > 0 && (
                <p className="text-xs text-slate-400">
                  Missing <span className="font-mono text-rose-300">{check.missing.map((pc) => names[pc]).join(", ")}</span>{" "}
                  - a finger may be muting that string, or press a little harder.
                </p>
              )}
              {check.extra.length > 0 && (
                <p className="text-xs text-slate-400">
                  Extra <span className="font-mono text-rose-300">{check.extra.map((pc) => names[pc]).join(", ")}</span>{" "}
                  - check for a wrong fret or a string that should be muted.
                </p>
              )}
            </div>
          )}

          {/* What's ringing, by note */}
          <div className="mt-4 grid grid-cols-12 gap-1 items-end h-16">
            {names.map((n, pc) => {
              const v = chroma ? chroma.pcs[pc] : 0;
              const tone = tones.includes(pc);
              return (
                <div key={pc} className="flex h-full flex-col items-center justify-end gap-1">
                  <div
                    className={`w-full rounded-sm ${tone ? "bg-emerald-400" : "bg-slate-500/60"}`}
                    style={{ height: `${Math.max(3, v * 100)}%`, transition: "height 90ms linear" }}
                  />
                  <span className={`font-mono text-[9px] ${tone ? "text-emerald-300" : "text-slate-600"}`}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chord picker */}
        <div className="space-y-3">
          {CHORD_GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">{group}</p>
              <div className="flex flex-wrap gap-1.5">
                {CHORDS.map((c, i) =>
                  c.group !== group ? null : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onChord(i)}
                      aria-pressed={i === chord}
                      className={`min-w-[2.75rem] rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors ${
                        i === chord
                          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                          : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {shapeLabel(c)}
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
