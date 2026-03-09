"use client";

import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-white/5">
      <div
        className="h-full transition-none"
        style={{
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, #818cf8 0%, #22d3ee 50%, #a78bfa 100%)",
          boxShadow: "0 0 10px rgba(129,140,248,0.6)",
        }}
      />
    </div>
  );
}
