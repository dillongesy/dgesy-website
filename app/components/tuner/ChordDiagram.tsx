"use client";

import { type ChordShape, noteName, shapeMidis } from "./music";

const X0 = 25, GAP = 20, TOP = 40, FRET_H = 28, FRETS = 5;
const sx = (i: number) => X0 + i * GAP;

/**
 * A standard chord box: low E on the left, nut at the top. `heard` lights up
 * the note names under the strings whose pitch class is ringing.
 */
export default function ChordDiagram({ shape, heard }: { shape: ChordShape; heard?: Set<number> }) {
  const fretted = shape.frets.filter((f) => f > 0);
  const base = Math.max(...shape.frets) > FRETS ? Math.min(...fretted) : 1;
  const fy = (fret: number) => TOP + (fret - base + 0.5) * FRET_H;
  const midis = shapeMidis(shape);

  return (
    <svg viewBox="0 0 150 212" className="w-full max-w-[220px]" role="img" aria-label={`Chord diagram, frets ${shape.frets.map((f) => (f < 0 ? "x" : f)).join(" ")}`}>
      {/* Nut (or a position marker further up the neck) */}
      {base === 1 ? (
        <rect x={sx(0) - 1} y={TOP - 4} width={GAP * 5 + 2} height={5} rx={1.5} fill="#e2e8f0" />
      ) : (
        <text x={6} y={fy(base) + 4} fontSize={11} fill="#94a3b8" fontFamily="var(--font-geist-mono)">{base}fr</text>
      )}
      {Array.from({ length: FRETS + 1 }, (_, f) => (
        <line key={f} x1={sx(0)} x2={sx(5)} y1={TOP + f * FRET_H} y2={TOP + f * FRET_H} stroke="rgba(148,163,184,0.35)" strokeWidth={1.2} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={sx(i)} x2={sx(i)} y1={TOP} y2={TOP + FRETS * FRET_H} stroke="rgba(203,213,225,0.55)" strokeWidth={0.8 + (5 - i) * 0.3} />
      ))}

      {/* Open / muted markers */}
      {shape.frets.map((f, i) =>
        f === 0 ? (
          <circle key={i} cx={sx(i)} cy={TOP - 16} r={5} fill="none" stroke="#34d399" strokeWidth={1.6} />
        ) : f < 0 ? (
          <g key={i} stroke="#64748b" strokeWidth={1.8} strokeLinecap="round">
            <line x1={sx(i) - 4.5} y1={TOP - 20.5} x2={sx(i) + 4.5} y2={TOP - 11.5} />
            <line x1={sx(i) + 4.5} y1={TOP - 20.5} x2={sx(i) - 4.5} y2={TOP - 11.5} />
          </g>
        ) : null,
      )}

      {shape.barre && (
        <rect
          x={sx(shape.barre.from) - 9}
          y={fy(shape.barre.fret) - 9}
          width={sx(shape.barre.to) - sx(shape.barre.from) + 18}
          height={18}
          rx={9}
          fill="#10b981"
        />
      )}
      {shape.frets.map((f, i) =>
        f > 0 ? (
          <g key={i}>
            <circle cx={sx(i)} cy={fy(f)} r={9} fill="#10b981" />
            <text x={sx(i)} y={fy(f) + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#022c22">
              {shape.fingers[i] || ""}
            </text>
          </g>
        ) : null,
      )}

      {/* The note each string sounds */}
      {midis.map((m, i) =>
        m == null ? null : (
          <text
            key={i}
            x={sx(i)}
            y={TOP + FRETS * FRET_H + 20}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-geist-mono)"
            fill={heard?.has(m % 12) ? "#34d399" : "#64748b"}
            style={{ transition: "fill 150ms" }}
          >
            {noteName(m, shape.root === 10 || shape.root === 3 || shape.root === 8)}
          </text>
        ),
      )}
    </svg>
  );
}
