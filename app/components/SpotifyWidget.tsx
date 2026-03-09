"use client";

import { useEffect, useState, useCallback } from "react";
import { Music2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface NowPlaying {
  isPlaying: boolean;
  notConfigured?: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
}

const POLL_INTERVAL_MS = 30_000;

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function SpotifyWidget() {
  const [data, setData] = useState<NowPlaying | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [progressMs, setProgressMs] = useState(0);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch("/api/spotify", { cache: "no-store" });
      if (!res.ok) return;
      const json: NowPlaying = await res.json();
      // If Spotify isn't configured at all, hide the widget entirely
      if (json.notConfigured) {
        setData(null);
        return;
      }
      setData(json);
      setProgressMs(json.progressMs ?? 0);
    } catch {
      // Silently fail — never crash the page
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNowPlaying();
    const id = setInterval(fetchNowPlaying, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNowPlaying]);

  // Tick the progress bar locally between polls
  useEffect(() => {
    if (!data?.isPlaying) return;
    const id = setInterval(() => setProgressMs((p) => p + 1000), 1000);
    return () => clearInterval(id);
  }, [data?.isPlaying]);

  // Don't render at all if Spotify isn't configured or nothing is playing
  if (!data || data.notConfigured) return null;

  const progress = data.durationMs
    ? Math.min((progressMs / data.durationMs) * 100, 100)
    : 0;

  return (
    <div
      className="fixed bottom-6 left-6 z-50 max-w-[280px] rounded-2xl border border-white/[0.08] bg-[#0f172a]/90 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300"
      style={{ boxShadow: "0 0 40px rgba(34,197,94,0.08), 0 8px 40px rgba(0,0,0,0.5)" }}
    >
      {/* Header row — always visible */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 group"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand now playing" : "Collapse now playing"}
      >
        <div className="flex items-center gap-2.5">
          {/* Pulsing music icon when playing */}
          <div className="relative flex items-center justify-center w-6 h-6">
            {data.isPlaying && (
              <span
                className="absolute inset-0 rounded-full bg-green-500/20"
                style={{ animation: "pulse-ring 2s ease-out infinite" }}
              />
            )}
            <Music2
              size={13}
              className={data.isPlaying ? "text-green-400" : "text-slate-500"}
            />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500">
            {data.isPlaying ? "Now Playing" : "Last Played"}
          </span>
        </div>
        <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Expandable content */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: collapsed ? 0 : 200 }}
      >
        <div className="px-4 pb-4">
          {data.isPlaying && data.title ? (
            <>
              <div className="flex gap-3 items-start mb-3">
                {/* Album art */}
                {data.albumArt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.albumArt}
                    alt={data.album ?? "Album art"}
                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center">
                    <Music2 size={16} className="text-slate-600" />
                  </div>
                )}

                {/* Track info */}
                <div className="min-w-0 flex-1">
                  <a
                    href={data.songUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link flex items-center gap-1 text-slate-100 font-semibold text-sm leading-tight hover:text-green-400 transition-colors"
                  >
                    <span className="truncate">{data.title}</span>
                    <ExternalLink size={10} className="flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{data.artist}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #22c55e, #16a34a)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-mono text-slate-600">
                  <span>{formatTime(progressMs)}</span>
                  <span>{formatTime(data.durationMs ?? 0)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-600 text-xs pb-1">Nothing playing right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}
