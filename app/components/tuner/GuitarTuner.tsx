"use client";

import { useEffect, useState } from "react";
import { Check, Guitar, Mic, MicOff, Minus, Plus, Settings2, Volume2 } from "lucide-react";
import ChordTrainer from "./ChordTrainer";
import TunerGauge, { IN_TUNE, tuneColor } from "./TunerGauge";
import { pluck } from "./dsp";
import {
  INSTRUMENTS,
  type GuitarString,
  type InstrumentId,
  cents as centsOf,
  detectionRange,
  freqToMidi,
  instrumentById,
  midiToFreq,
  noteName,
  octaveOf,
  stringsOf,
  tuningsFor,
} from "./music";
import { playSamples, useAudioInput } from "./useAudioInput";

type Mode = "auto" | "manual" | "chromatic";
type Sensitivity = "low" | "medium" | "high";

interface Settings {
  instrument: InstrumentId;
  strings: number;
  tuning: string;
  a4: number;
  mode: Mode;
  sensitivity: Sensitivity;
  deviceId: string;
  autoAdvance: boolean;
  chord: number;
}

const DEFAULTS: Settings = {
  instrument: "electric",
  strings: 6,
  tuning: "standard",
  a4: 440,
  mode: "auto",
  sensitivity: "medium",
  deviceId: "",
  autoAdvance: true,
  chord: 0,
};

const GATE_DB: Record<Sensitivity, number> = { low: -40, medium: -52, high: -62 };
const STORAGE_KEY = "dgesy-tuner-v1";

/** Snap a (possibly stale or hand-edited) settings object onto valid choices. */
function normalise(s: Settings): Settings {
  const inst = instrumentById(s.instrument);
  const strings = inst.stringCounts.includes(s.strings) ? s.strings : inst.stringCounts[0];
  const tunings = tuningsFor(inst.id, strings);
  return {
    ...s,
    instrument: inst.id,
    strings,
    tuning: tunings.some((t) => t.id === s.tuning) ? s.tuning : tunings[0].id,
    a4: Math.min(466, Math.max(415, Math.round(s.a4) || 440)),
  };
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalise({ ...DEFAULTS, ...JSON.parse(raw) });
  } catch {
    // private mode / blocked storage: defaults are fine
  }
  return DEFAULTS;
}

interface Reading {
  name: string;
  octave: number;
  cents: number;
  freq: number;
  /** Index into the strings array, when the reading is about a string. */
  stringIdx: number | null;
  /** Auto mode heard something nowhere near an open string. */
  offString: boolean;
}

function read(freq: number, mode: Mode, strings: GuitarString[], target: number, a4: number, flats: boolean): Reading {
  const chromatic = (offString: boolean): Reading => {
    const midi = Math.round(freqToMidi(freq, a4));
    return { name: noteName(midi, flats), octave: octaveOf(midi), cents: centsOf(freq, midiToFreq(midi, a4)), freq, stringIdx: null, offString };
  };
  if (mode === "chromatic") return chromatic(false);

  const forString = (i: number, c: number): Reading => ({
    name: strings[i].name,
    octave: strings[i].octave,
    cents: c,
    freq,
    stringIdx: i,
    offString: false,
  });

  if (mode === "manual") {
    let c = centsOf(freq, midiToFreq(strings[target].midi, a4));
    // An octave slip in the detector (or a harmonic) still means "this string".
    if (Math.abs(c - 1200) < 80) c -= 1200;
    else if (Math.abs(c + 1200) < 80) c += 1200;
    return forString(target, c);
  }

  const nearest = (f: number) => {
    let best = 0, bestC = Infinity;
    strings.forEach((s, i) => {
      const c = centsOf(f, midiToFreq(s.midi, a4));
      if (Math.abs(c) < Math.abs(bestC)) {
        best = i;
        bestC = c;
      }
    });
    return { i: best, c: bestC };
  };
  const direct = nearest(freq);
  if (Math.abs(direct.c) <= 100) return forString(direct.i, direct.c);
  for (const f of [freq / 2, freq * 2]) {
    const folded = nearest(f);
    if (Math.abs(folded.c) <= 50) return forString(folded.i, folded.c);
  }
  return chromatic(true);
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-white/[0.07] bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            o.value === value ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/40" : "text-slate-400 hover:text-slate-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const fieldLabel = "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500";
const selectCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/50 [&>option]:bg-[#04140f]";

export default function GuitarTuner() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [tab, setTab] = useState<"tuner" | "chords">("tuner");
  const [showMore, setShowMore] = useState(false);
  const [target, setTarget] = useState(0);
  const [tuned, setTuned] = useState<{ key: string; set: number[] }>({ key: "", set: [] });

  const update = (patch: Partial<Settings>) => setSettings((s) => normalise({ ...s, ...patch }));
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // not persisted, still works
    }
  }, [settings]);

  const instrument = instrumentById(settings.instrument);
  const tunings = tuningsFor(settings.instrument, settings.strings);
  const tuning = tunings.find((t) => t.id === settings.tuning) ?? tunings[0];
  const strings = stringsOf(tuning);
  const { minFreq, maxFreq } = detectionRange(tuning, settings.a4);
  const tuningKey = `${settings.instrument}/${settings.strings}/${tuning.id}/${settings.a4}`;
  const tunedSet = tuned.key === tuningKey ? tuned.set : [];
  const targetIdx = Math.min(target, strings.length - 1);

  const audio = useAudioInput({
    minFreq,
    maxFreq,
    gateDb: GATE_DB[settings.sensitivity],
    wantChroma: tab === "chords",
    a4: settings.a4,
  });
  const running = audio.status === "running";
  const { frame } = audio;
  const live = frame.freq != null;
  const shownFreq = frame.freq ?? frame.heldFreq;

  const reading =
    shownFreq == null ? null : read(shownFreq, settings.mode, strings, targetIdx, settings.a4, !!tuning.flats);

  // A string counts as tuned once it has sat inside the window for a moment.
  // Worked out once per audio frame, during render (React's "adjusting state
  // when a prop changes" pattern) rather than in an effect.
  const [seen, setSeen] = useState<{ frame: typeof frame; since: number | null }>({ frame, since: null });
  if (seen.frame !== frame) {
    let since: number | null = null;
    if (reading && reading.stringIdx != null && live) {
      const idx = reading.stringIdx;
      const has = tunedSet.includes(idx);
      if (Math.abs(reading.cents) <= IN_TUNE) {
        since = seen.since ?? frame.t;
        if (!has && frame.t - since > 700) {
          setTuned({ key: tuningKey, set: [...tunedSet, idx] });
          if (settings.mode === "manual" && settings.autoAdvance) {
            const next = strings.findIndex((_, i) => i > idx && !tunedSet.includes(i));
            if (next >= 0) setTarget(next);
          }
        }
      } else if (has && Math.abs(reading.cents) > 10) {
        setTuned({ key: tuningKey, set: tunedSet.filter((i) => i !== idx) });
      }
    }
    setSeen({ frame, since });
  }

  const playString = (i: number) => playSamples((sr) => pluck(midiToFreq(strings[i].midi, settings.a4), sr, 2.5));
  const refIdx = settings.mode === "manual" ? targetIdx : reading?.stringIdx ?? null;

  const status = (() => {
    if (!running) return { text: "Press Start, then play a string", color: "text-slate-400" };
    if (!reading)
      return {
        text: settings.mode === "manual" ? `Play string ${strings[targetIdx].number} (${strings[targetIdx].name})` : "Play a string",
        color: "text-slate-400",
      };
    if (reading.offString) return { text: "Not near an open string - showing the nearest note", color: "text-slate-400" };
    const c = reading.cents;
    if (Math.abs(c) <= IN_TUNE) return { text: "In tune", color: "text-emerald-300" };
    if (Math.abs(c) > 50) {
      const semis = Math.round(Math.abs(c) / 100);
      return {
        text: c < 0 ? `${semis} semitone${semis === 1 ? "" : "s"} flat - tighten` : `${semis} semitone${semis === 1 ? "" : "s"} sharp - loosen`,
        color: "text-rose-300",
      };
    }
    return { text: c < 0 ? "Flat - tune up" : "Sharp - tune down", color: Math.abs(c) <= 10 ? "text-amber-300" : "text-rose-300" };
  })();

  const levelPct = Number.isFinite(frame.levelDb) ? Math.max(0, Math.min(100, ((frame.levelDb + 70) / 70) * 100)) : 0;
  const gatePct = ((GATE_DB[settings.sensitivity] + 70) / 70) * 100;
  const deviceValue = settings.deviceId || audio.activeDeviceId;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/15 bg-[#04140f]/70 backdrop-blur-xl p-4 sm:p-6 shadow-2xl shadow-emerald-950/40">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Guitar size={14} className="text-emerald-400" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400/80">Guitar Tuner</span>
        <div className="ml-auto">
          <Segmented
            label="View"
            value={tab}
            onChange={setTab}
            options={[
              { value: "tuner", label: "Tuner" },
              { value: "chords", label: "Chords" },
            ]}
          />
        </div>
      </div>

      {/* Setup */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className={fieldLabel}>Instrument</span>
          <Segmented
            label="Instrument"
            value={settings.instrument}
            onChange={(instrument) => update({ instrument })}
            options={INSTRUMENTS.map((i) => ({ value: i.id, label: i.label }))}
          />
        </div>
        <div>
          <span className={fieldLabel}>Strings</span>
          <Segmented
            label="Strings"
            value={settings.strings}
            onChange={(n) => update({ strings: n })}
            options={instrument.stringCounts.map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
        <label className="block">
          <span className={fieldLabel}>Tuning</span>
          <select className={selectCls} value={tuning.id} onChange={(e) => update({ tuning: e.target.value })}>
            {tunings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={fieldLabel}>Input</span>
          <select
            className={selectCls}
            value={deviceValue}
            onChange={(e) => {
              update({ deviceId: e.target.value });
              if (running) void audio.start(e.target.value);
            }}
            onFocus={() => void audio.refreshDevices()}
          >
            {audio.devices.length === 0 && <option value="">Default input (press Start to list devices)</option>}
            {audio.devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => (running ? audio.stop() : void audio.start(settings.deviceId || undefined))}
            disabled={audio.status === "starting"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
              running
                ? "border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                : "bg-emerald-500 text-[#022c22] hover:bg-emerald-400"
            }`}
          >
            {running ? <MicOff size={15} /> : <Mic size={15} />}
            {running ? "Stop" : audio.status === "starting" ? "Starting..." : "Start"}
          </button>
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            aria-label="More settings"
            className={`rounded-lg border p-2 transition-colors ${
              showMore ? "border-emerald-400/40 text-emerald-300" : "border-white/10 text-slate-400 hover:text-slate-100"
            }`}
          >
            <Settings2 size={18} />
          </button>
        </div>

        {showMore && (
          <div className="sm:col-span-2 grid gap-4 rounded-xl border border-white/[0.07] bg-black/20 p-4 sm:grid-cols-2">
            <div>
              <span className={fieldLabel}>Reference pitch (A4)</span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Lower reference pitch" onClick={() => update({ a4: settings.a4 - 1 })} className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:text-white">
                  <Minus size={14} />
                </button>
                <span className="w-20 text-center font-mono text-sm text-slate-200">{settings.a4} Hz</span>
                <button type="button" aria-label="Raise reference pitch" onClick={() => update({ a4: settings.a4 + 1 })} className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:text-white">
                  <Plus size={14} />
                </button>
                {settings.a4 !== 440 && (
                  <button type="button" onClick={() => update({ a4: 440 })} className="text-xs text-slate-500 hover:text-emerald-300">
                    Reset
                  </button>
                )}
              </div>
            </div>
            <div>
              <span className={fieldLabel}>Sensitivity</span>
              <Segmented
                label="Sensitivity"
                value={settings.sensitivity}
                onChange={(sensitivity) => update({ sensitivity })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
              <p className="mt-1.5 text-[11px] text-slate-500">Lower it in a noisy room; raise it if quiet notes don&apos;t register.</p>
            </div>
          </div>
        )}
      </div>

      {audio.error && (
        <p role="alert" className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {audio.error}
        </p>
      )}

      {/* Input level, with the sensitivity gate marked */}
      <div className="mt-5 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Level</span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full ${frame.levelDb > GATE_DB[settings.sensitivity] ? "bg-emerald-400" : "bg-slate-500"}`}
            style={{ width: `${levelPct}%`, transition: "width 60ms linear" }}
          />
          <div className="absolute inset-y-0 w-px bg-white/30" style={{ left: `${gatePct}%` }} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-6 border-t border-white/[0.06] pt-6">
        {tab === "tuner" ? (
          <div className="flex flex-col items-center">
            <TunerGauge cents={reading?.cents ?? null} live={live} />

            {/* Readout */}
            <div className="mt-2 flex flex-col items-center" aria-live="polite">
              <div className="flex items-start leading-none" style={{ color: reading ? tuneColor(reading.cents) : "#475569", opacity: live || !reading ? 1 : 0.5 }}>
                <span className="text-7xl font-black tracking-tight">{reading?.name ?? "-"}</span>
                {reading && <span className="mt-1 text-2xl font-bold opacity-70">{reading.octave}</span>}
              </div>
              <div className="mt-2 flex gap-4 font-mono text-xs tabular-nums text-slate-500">
                <span>{reading ? `${reading.freq.toFixed(2)} Hz` : "--- Hz"}</span>
                <span>{reading ? `${reading.cents > 0 ? "+" : ""}${reading.cents.toFixed(1)}¢` : "--¢"}</span>
              </div>
              <p className={`mt-2 text-sm font-medium ${status.color}`}>{status.text}</p>
            </div>

            {/* Strings */}
            {settings.mode !== "chromatic" && (
              <div className="mt-6 w-full">
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {strings.map((s, i) => {
                    const isTarget = settings.mode === "manual" ? i === targetIdx : reading?.stringIdx === i && live;
                    const isTuned = tunedSet.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTarget(i);
                          if (settings.mode !== "manual") update({ mode: "manual" });
                        }}
                        aria-pressed={isTarget}
                        aria-label={`String ${s.number}, ${s.name}${s.octave}${isTuned ? ", tuned" : ""}`}
                        className={`group relative flex w-full max-w-[64px] flex-col items-center rounded-xl border px-1 pb-2 pt-2 transition-colors ${
                          isTarget
                            ? "border-emerald-400/60 bg-emerald-400/10"
                            : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        {/* The string itself: thicker for the low ones */}
                        <span
                          className={`h-8 rounded-full ${isTuned ? "bg-emerald-400" : "bg-slate-400/70"}`}
                          style={{ width: `${1 + ((strings.length - 1 - i) / Math.max(1, strings.length - 1)) * 3}px` }}
                          aria-hidden="true"
                        />
                        <span className={`mt-1.5 text-base font-bold ${isTarget ? "text-emerald-200" : "text-slate-200"}`}>{s.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{s.number}</span>
                        {isTuned && (
                          <Check size={12} strokeWidth={3} className="absolute right-1 top-1 text-emerald-400" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {tunedSet.length === strings.length && (
                  <p className="mt-3 text-center text-sm font-medium text-emerald-300">All {strings.length} strings in tune. Go play.</p>
                )}
              </div>
            )}

            {/* Mode + reference */}
            <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3">
              <Segmented
                label="Mode"
                value={settings.mode}
                onChange={(mode) => update({ mode })}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "manual", label: "Pick string" },
                  { value: "chromatic", label: "Chromatic" },
                ]}
              />
              {refIdx != null && settings.mode !== "chromatic" && (
                <button
                  type="button"
                  onClick={() => playString(refIdx)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300 transition-colors"
                >
                  <Volume2 size={14} /> Play {strings[refIdx].name}
                  {strings[refIdx].octave}
                </button>
              )}
              {settings.mode === "manual" && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={settings.autoAdvance}
                    onChange={(e) => update({ autoAdvance: e.target.checked })}
                    className="accent-emerald-500"
                  />
                  Next string when tuned
                </label>
              )}
            </div>
            <p className="mt-3 max-w-md text-center text-[11px] leading-relaxed text-slate-500">
              {settings.mode === "auto"
                ? "Auto works out which string you're playing. Click a string to lock onto it instead."
                : settings.mode === "manual"
                  ? "Locked to one string - handy when a string is way out and auto would guess the wrong one."
                  : "Shows the nearest note to whatever you play - for checking frets and learning the neck."}
            </p>
          </div>
        ) : (
          <ChordTrainer
            chord={settings.chord}
            onChord={(chord) => update({ chord })}
            chroma={frame.chroma}
            running={running}
            standardTuning={settings.instrument !== "bass" && settings.instrument !== "ukulele" && settings.strings === 6 && tuning.id === "standard"}
            a4={settings.a4}
          />
        )}
      </div>
    </div>
  );
}
