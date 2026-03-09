"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -200, y: -200 });
  const glowPos = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      glowPos.current.x = lerp(glowPos.current.x, pos.current.x, 0.1);
      glowPos.current.y = lerp(glowPos.current.y, pos.current.y, 0.1);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glowPos.current.x - 200}px, ${glowPos.current.y - 200}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Large soft glow */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 z-50 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(129,140,248,0.06) 0%, rgba(34,211,238,0.03) 50%, transparent 70%)",
          willChange: "transform",
        }}
      />
      {/* Small precise dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-50 w-2 h-2 rounded-full"
        style={{
          background: "rgba(129,140,248,0.9)",
          boxShadow: "0 0 8px rgba(129,140,248,0.9), 0 0 16px rgba(34,211,238,0.5)",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
