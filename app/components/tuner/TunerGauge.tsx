"use client";

/** How close counts as in tune, in cents. Most ears can't hear under ~5. */
export const IN_TUNE = 3;
const CLOSE = 10;
const SWING = 60; // needle degrees at ±50 cents

export const tuneColor = (c: number) =>
  Math.abs(c) <= IN_TUNE ? "#34d399" : Math.abs(c) <= CLOSE ? "#fbbf24" : "#fb7185";

const CX = 160, CY = 160, R = 128;
const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};
const arc = (from: number, to: number, r: number) => {
  const [x1, y1] = polar(from, r);
  const [x2, y2] = polar(to, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
};

/**
 * A ±50 cent needle. `cents` null = nothing sounding (needle rests, dimmed);
 * `live` false = showing a held reading after the note died.
 */
export default function TunerGauge({ cents, live }: { cents: number | null; live: boolean }) {
  const shown = cents == null ? 0 : Math.max(-50, Math.min(50, cents));
  const angle = (shown / 50) * SWING;
  const color = cents == null ? "#475569" : tuneColor(cents);
  const inTune = cents != null && Math.abs(cents) <= IN_TUNE;

  return (
    <svg viewBox="0 0 320 178" className="w-full max-w-[420px]" role="img" aria-label={
      cents == null ? "No note" : `${cents > 0 ? "+" : ""}${cents.toFixed(1)} cents`
    }>
      <defs>
        {/* userSpaceOnUse: the default bounding-box region is zero-wide for the
            upright needle, which made the filter erase it entirely. */}
        <filter id="tuner-glow" filterUnits="userSpaceOnUse" x={0} y={0} width={320} height={178}>
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track, then the in-tune window */}
      <path d={arc(-SWING - 4, SWING + 4, R)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round" />
      <path
        d={arc((-IN_TUNE / 50) * SWING - 1.5, (IN_TUNE / 50) * SWING + 1.5, R)}
        fill="none"
        stroke="#34d399"
        strokeOpacity={inTune ? 0.9 : 0.35}
        strokeWidth={14}
        filter={inTune ? "url(#tuner-glow)" : undefined}
        style={{ transition: "stroke-opacity 200ms" }}
      />

      {/* Ticks every 5 cents, labels every 25 */}
      {Array.from({ length: 21 }, (_, i) => {
        const c = -50 + i * 5;
        const deg = (c / 50) * SWING;
        const major = c % 25 === 0;
        const [x1, y1] = polar(deg, R - 14);
        const [x2, y2] = polar(deg, R - (major ? 28 : 21));
        const [lx, ly] = polar(deg, R - 40);
        return (
          <g key={c}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c === 0 ? "#34d399" : "rgba(148,163,184,0.5)"} strokeWidth={major ? 2 : 1} />
            {major && (
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize={10} fill="rgba(148,163,184,0.7)" fontFamily="var(--font-geist-mono)">
                {c > 0 ? `+${c}` : c}
              </text>
            )}
          </g>
        );
      })}
      <text x={CX - R + 4} y={CY + 16} textAnchor="middle" fontSize={10} fill="rgba(148,163,184,0.6)" fontFamily="var(--font-geist-mono)">♭</text>
      <text x={CX + R - 4} y={CY + 16} textAnchor="middle" fontSize={10} fill="rgba(148,163,184,0.6)" fontFamily="var(--font-geist-mono)">♯</text>

      {/* Needle */}
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: "transform 120ms ease-out",
          opacity: cents == null ? 0.35 : live ? 1 : 0.45,
        }}
      >
        <line x1={CX} y1={CY} x2={CX} y2={CY - R + 6} stroke={color} strokeWidth={3} strokeLinecap="round" filter="url(#tuner-glow)" />
      </g>
      <circle cx={CX} cy={CY} r={7} fill="#04140f" stroke={color} strokeWidth={2.5} />
    </svg>
  );
}
