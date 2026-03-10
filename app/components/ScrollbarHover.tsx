"use client";

import { useEffect } from "react";

const EDGE_THRESHOLD = 20; // px from right edge to trigger

export default function ScrollbarHover() {
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const nearEdge = e.clientX >= window.innerWidth - EDGE_THRESHOLD;
      document.body.classList.toggle("scrollbar-hover", nearEdge);
    };
    const onMouseLeave = () => document.body.classList.remove("scrollbar-hover");

    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return null;
}
