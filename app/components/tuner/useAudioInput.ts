"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Chroma, PitchDetector, chromaFromSpectrum, rms, toDb } from "./dsp";

// The microphone lives here and ONLY here: nothing is captured until the user
// presses Start, and the stream is released on Stop or when the page unmounts.

export type InputStatus = "idle" | "starting" | "running" | "error";

export interface InputDevice {
  id: string;
  label: string;
}

export interface AudioFrame {
  /** performance.now() when the frame was captured. */
  t: number;
  levelDb: number;
  /** Median-smoothed pitch while a clear note is sounding, else null. */
  freq: number | null;
  /** The last good pitch, kept for a moment after the note dies so the display doesn't blink out. */
  heldFreq: number | null;
  /** Smoothed pitch-class energy for the chord trainer; null unless asked for and something is ringing. */
  chroma: Chroma | null;
}

export interface AudioOptions {
  minFreq: number;
  maxFreq: number;
  /** Below this input level (dBFS) everything is treated as silence. */
  gateDb: number;
  wantChroma: boolean;
  a4: number;
}

const SILENT: AudioFrame = { t: 0, levelDb: -Infinity, freq: null, heldFreq: null, chroma: null };
const MIN_CLARITY = 0.85;
const HISTORY = 7; // frames in the median: ~115 ms at 60 fps
const HOLD_MS = 1500;
const PUBLISH_MS = 33;

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[s.length >> 1];
};

function describe(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone access was blocked. Allow it for this site in your browser's address bar, then press Start again.";
  if (name === "NotFoundError") return "No microphone or audio input was found. Plug one in and try again.";
  if (name === "NotReadableError")
    return "That input is busy or blocked by the system. Close other apps using it, or pick another input.";
  if (err instanceof Error && err.message === "insecure")
    return "This browser can't use the microphone on this page (it needs HTTPS).";
  return "Couldn't start the audio input.";
}

export function useAudioInput(options: AudioOptions) {
  const [status, setStatus] = useState<InputStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<InputDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [frame, setFrame] = useState<AudioFrame>(SILENT);

  // The loop reads options from a ref, so changing a setting never restarts the mic.
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  const live = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const list = await navigator.mediaDevices.enumerateDevices();
    setDevices(
      list
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({ id: d.deviceId, label: d.label || `Input ${i + 1}` })),
    );
  }, []);

  const stop = useCallback(() => {
    const cur = live.current;
    live.current = null;
    if (cur) {
      cancelAnimationFrame(cur.raf);
      cur.stream.getTracks().forEach((t) => t.stop());
      void cur.ctx.close();
    }
    setFrame(SILENT);
    setStatus("idle");
  }, []);

  const start = useCallback(
    async (deviceId?: string) => {
      stop();
      setStatus("starting");
      setError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("insecure");
        // Turn off everything the browser does to make voices sound nice on a
        // call - it would gate, squash, and "denoise" a guitar into mush.
        const audio = (id?: string): MediaTrackConstraints => ({
          deviceId: id ? { exact: id } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        });
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: audio(deviceId) });
        } catch (err) {
          // A remembered device that's since been unplugged: fall back to the default.
          if (!deviceId || !(err instanceof DOMException) || err.name !== "OverconstrainedError") throw err;
          stream = await navigator.mediaDevices.getUserMedia({ audio: audio() });
        }

        const ctx = new AudioContext({ latencyHint: "interactive" });
        await ctx.resume();
        const source = ctx.createMediaStreamSource(stream);
        const timeAn = ctx.createAnalyser();
        timeAn.fftSize = 8192;
        const specAn = ctx.createAnalyser();
        specAn.fftSize = 16384;
        specAn.smoothingTimeConstant = 0.5;
        source.connect(timeAn);
        source.connect(specAn);
        // Deliberately NOT connected to ctx.destination: no monitoring, no feedback.

        const timeBuf = new Float32Array(timeAn.fftSize);
        const specBuf = new Float32Array(specAn.frequencyBinCount);
        const chromaNow = new Float32Array(12);
        const chromaAvg = new Float32Array(12);
        const binHz = ctx.sampleRate / specAn.fftSize;
        const history: number[] = [];
        let detector: PitchDetector | null = null;
        let detectorKey = "";
        let lastPitchAt = 0, lastChordAt = 0, lastPublish = 0, onsetAt = 0;
        let prevDb = -Infinity;
        let held: number | null = null;
        let bass: number | null = null;

        const tick = () => {
          if (!live.current) return;
          live.current.raf = requestAnimationFrame(tick);
          const now = performance.now();
          const o = optsRef.current;

          timeAn.getFloatTimeDomainData(timeBuf);
          const levelDb = toDb(rms(timeBuf, timeBuf.length - 2048));
          const loud = levelDb > o.gateDb;
          // A jump in level is a new pick or strum. Its first ~120 ms is
          // scrape and click, not notes, so the chord view waits that out.
          if (levelDb - prevDb > 6) onsetAt = now;
          prevDb = levelDb;

          const key = `${o.minFreq.toFixed(2)}-${o.maxFreq.toFixed(2)}`;
          if (key !== detectorKey) {
            detector = new PitchDetector(ctx.sampleRate, o.minFreq, o.maxFreq);
            detectorKey = key;
            history.length = 0;
          }
          if (loud && detector) {
            const est = detector.detect(timeBuf);
            if (est && est.clarity >= MIN_CLARITY && est.freq >= o.minFreq && est.freq <= o.maxFreq) {
              history.push(est.freq);
              if (history.length > HISTORY) history.shift();
              lastPitchAt = now;
            }
          }
          if (now - lastPitchAt > 250) history.length = 0;
          // Three agreeing frames before showing anything skips the pick's attack.
          const freq = history.length >= 3 ? median(history) : null;
          if (freq != null) held = freq;
          else if (now - lastPitchAt > HOLD_MS) held = null;

          if (o.wantChroma) {
            if (loud && now - onsetAt > 120) {
              specAn.getFloatFrequencyData(specBuf);
              for (let i = 0; i < specBuf.length; i++) specBuf[i] = 10 ** (specBuf[i] / 20);
              const c = chromaFromSpectrum(specBuf, binHz, o.a4, chromaNow);
              if (c) {
                // A fresh strum starts a fresh average rather than blending into the last chord.
                const k = now - lastChordAt > 300 || onsetAt > lastChordAt ? 1 : 0.25;
                for (let i = 0; i < 12; i++) chromaAvg[i] = (1 - k) * chromaAvg[i] + k * c.pcs[i];
                if (c.bass != null) bass = c.bass;
                lastChordAt = now;
              }
            } else if (now - lastChordAt > HOLD_MS) {
              chromaAvg.fill(0);
              bass = null;
            }
          }

          if (now - lastPublish >= PUBLISH_MS) {
            lastPublish = now;
            setFrame({
              t: now,
              levelDb,
              freq,
              heldFreq: held,
              chroma:
                o.wantChroma && now - lastChordAt < HOLD_MS ? { pcs: Float32Array.from(chromaAvg), bass } : null,
            });
          }
        };

        live.current = { stream, ctx, raf: 0 };
        setActiveDeviceId(stream.getAudioTracks()[0]?.getSettings().deviceId ?? "");
        setStatus("running");
        // Device names are only readable once permission has been granted.
        void refreshDevices();
        tick();
      } catch (err) {
        live.current = null;
        setStatus("error");
        setError(describe(err));
      }
    },
    [stop, refreshDevices],
  );

  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const onChange = () => void refreshDevices();
    md.addEventListener("devicechange", onChange);
    return () => md.removeEventListener("devicechange", onChange);
  }, [refreshDevices]);

  // Release the mic when leaving the page.
  useEffect(() => stop, [stop]);

  return { status, error, devices, activeDeviceId, frame, start, stop, refreshDevices };
}

// ── Playback (reference tones and chords) ──────────────────────────────────

let outCtx: AudioContext | null = null;
let playing: AudioBufferSourceNode | null = null;

/** Play mono samples rendered at the output's sample rate. Stops whatever was playing. */
export function playSamples(render: (sampleRate: number) => Float32Array, volume = 0.8) {
  outCtx ??= new AudioContext();
  void outCtx.resume();
  try {
    playing?.stop();
  } catch {
    // already ended
  }
  const data = render(outCtx.sampleRate);
  const buffer = outCtx.createBuffer(1, data.length, outCtx.sampleRate);
  buffer.getChannelData(0).set(data);
  const src = outCtx.createBufferSource();
  src.buffer = buffer;
  const gain = outCtx.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(outCtx.destination);
  src.start();
  playing = src;
}
