"use client";

import { useState } from "react";

export default function ScreenshotGallery({ screenshots }: { screenshots: string[] }) {
  // A screenshot that hasn't been dropped into /public yet shouldn't render as a
  // broken-image icon - drop it from the strip, and hide the whole section if
  // none of them resolve.
  const [failed, setFailed] = useState<string[]>([]);
  const visible = screenshots.filter((src) => !failed.includes(src));

  if (visible.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
        Screenshots
      </h2>
      <div
        className="
          flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2
          [&::-webkit-scrollbar]:h-[6px]
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-white/[0.04]
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-indigo-500/50
        "
        style={{ scrollbarWidth: "auto", scrollbarColor: "#6366f1 rgba(255,255,255,0.04)" }}
      >
        {visible.map((src, i) => (
          <div
            key={src}
            className="flex-shrink-0 snap-start rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Screenshot ${i + 1}`}
              onError={() => setFailed((f) => (f.includes(src) ? f : [...f, src]))}
              className="h-[300px] w-auto block"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
