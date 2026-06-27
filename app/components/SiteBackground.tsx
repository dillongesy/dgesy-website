"use client";

import { usePathname } from "next/navigation";
import ParticleCanvas from "./ParticleCanvas";

export default function SiteBackground() {
  const pathname = usePathname();
  // /experimental and blog posts use the Three.js vine backdrop instead.
  const usesVine =
    pathname === "/experimental" ||
    pathname.startsWith("/experimental/") ||
    pathname.startsWith("/blog/");

  if (usesVine) return null;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <ParticleCanvas />
    </div>
  );
}
