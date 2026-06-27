"use client";

import dynamic from "next/dynamic";

const LeafGrowth3D = dynamic(() => import("./LeafGrowth3D"), { ssr: false });

export default function VineBackground(props: {
  loop?: boolean;
  laneCount?: number;
  opacity?: number;
}) {
  return <LeafGrowth3D {...props} />;
}
