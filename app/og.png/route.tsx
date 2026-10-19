import { ImageResponse } from "next/og";

import { OG_IMAGE } from "../lib/site";

// The card shown when a link to the site is pasted into Slack, LinkedIn, iMessage,
// email, etc. Rendered once at build time to out/og.png. (A route rather than the
// opengraph-image file convention, because that one is exported without a file
// extension and nginx would then serve it with the wrong content type.)
export const dynamic = "force-static";

const COLORS = ["#818cf8", "#22d3ee", "#a78bfa"];

// A still frame of the hero orb: points on a tilted sphere joined to their
// nearest neighbours, back-facing points dimmed so it reads as 3D.
function orb() {
  const n = 150;
  const R = 190;
  const tilt = 0.45;
  const spin = 0.6;
  const pts = Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5)) + spin;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    // tilt toward the viewer around the x axis
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return { x: x * R, y: y2 * R, z: z2, c: COLORS[i % 3] };
  });

  const lines: { a: (typeof pts)[number]; b: (typeof pts)[number] }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = pts[i];
      const b = pts[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < 46 && Math.abs(a.z - b.z) < 0.25) lines.push({ a, b });
    }
  }
  return { pts, lines, R };
}

export function GET() {
  const { pts, lines, R } = orb();
  const box = R * 2 + 40;
  const o = box / 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          backgroundColor: "#030712",
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          padding: "0 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 6,
              color: "#818cf8",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Portfolio
          </div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 900, color: "#ffffff", letterSpacing: -3, lineHeight: 1 }}>
            Dillon Gesy
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#22d3ee", marginTop: 22 }}>
            Software &amp; IT Engineer
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#94a3b8", marginTop: 18, maxWidth: 560, lineHeight: 1.4 }}>
            Mobile apps, cloud backends, web portals, and network infrastructure.
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 48, fontSize: 24, color: "#cbd5e1" }}>
            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, backgroundColor: "#34d399", marginRight: 14 }} />
            dgesy.org
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: box,
            height: box,
            backgroundImage: "radial-gradient(circle, rgba(129,140,248,0.22) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)",
          }}
        >
          <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
            {lines.map(({ a, b }, i) => (
              <line
                key={i}
                x1={o + a.x}
                y1={o + a.y}
                x2={o + b.x}
                y2={o + b.y}
                stroke={a.c}
                strokeWidth={1}
                strokeOpacity={0.12 + 0.28 * ((a.z + b.z) / 4 + 0.5)}
              />
            ))}
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={o + p.x}
                cy={o + p.y}
                r={1.6 + 1.8 * (p.z / 2 + 0.5)}
                fill={p.c}
                fillOpacity={0.3 + 0.7 * (p.z / 2 + 0.5)}
              />
            ))}
          </svg>
        </div>
      </div>
    ),
    { width: OG_IMAGE.width, height: OG_IMAGE.height },
  );
}
