"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Music2, ExternalLink } from "lucide-react";

const ENDPOINT = process.env.NEXT_PUBLIC_SPOTIFY_NOW_PLAYING_URL;
const POLL_MS = 15000;

type NowPlaying = {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
};

function EqualizerBars() {
  return (
    <div className="flex items-end gap-[3px] h-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-emerald-400"
          animate={{ height: ["30%", "100%", "45%", "85%", "30%"] }}
          transition={{
            duration: 0.9 + i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function SpotifyNowPlaying() {
  const [data, setData] = useState<NowPlaying | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!ENDPOINT) return;
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch(ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as NowPlaying;
        if (alive) {
          setData(json);
          setErrored(false);
        }
      } catch {
        if (alive) setErrored(true);
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const playing = data?.isPlaying && data.title;
  const pct =
    data?.durationMs && data?.progressMs
      ? Math.min(100, (data.progressMs / data.durationMs) * 100)
      : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/15 bg-[#04140f]/70 backdrop-blur-xl p-4 shadow-2xl shadow-emerald-950/40">
      <div className="flex items-center gap-2 mb-3">
        <Music2 size={14} className="text-emerald-400" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400/80">
          {playing ? "Now Playing" : "Not Currently Playing"}
        </span>
        {playing && (
          <span className="ml-auto">
            <EqualizerBars />
          </span>
        )}
      </div>

      {playing ? (
        <a
          href={data!.songUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3"
        >
          {data!.albumImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data!.albumImageUrl}
              alt={data!.album || ""}
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-emerald-500/10 grid place-items-center">
              <Music2 size={20} className="text-emerald-400/60" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
              {data!.title}
            </p>
            <p className="truncate text-xs text-slate-400">{data!.artist}</p>
            <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-1000 ease-linear"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <ExternalLink
            size={14}
            className="text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0"
          />
        </a>
      ) : (
        <div className="flex items-center gap-3 py-1">
          <div className="h-14 w-14 rounded-lg bg-white/[0.03] grid place-items-center ring-1 ring-white/5">
            <Music2 size={20} className="text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-300">
              {!ENDPOINT
                ? "Not connected"
                : errored
                  ? "Offline"
                  : "Nothing playing"}
            </p>
            <p className="text-xs text-slate-500">
              {!ENDPOINT
                ? "Set the now-playing endpoint to go live"
                : "Dillon isn't listening to anything right now"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
