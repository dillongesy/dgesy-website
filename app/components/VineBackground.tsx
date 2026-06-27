"use client";

import dynamic from "next/dynamic";

// Client-only wrapper so server components (e.g. blog posts) can mount the
// Three.js vine, which must not be server-rendered.
const LeafGrowth3D = dynamic(() => import("./LeafGrowth3D"), { ssr: false });

export default function VineBackground(props: {
  loop?: boolean;
  laneCount?: number;
  opacity?: number;
}) {
  return <LeafGrowth3D {...props} />;
}
