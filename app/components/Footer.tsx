"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isExperimental = pathname.replace(/\/$/, "") === "/experimental";

  return (
    <footer
      className={`py-10 px-6 text-center ${
        isExperimental ? "" : "border-t border-white/[0.04]"
      }`}
    >
      <p className="text-sm text-slate-600 font-mono">
        Built by <span className="text-indigo-400">Dillon Gesy</span>
        {" - "}
        <span className="text-slate-700">{new Date().getFullYear()}</span>
      </p>
    </footer>
  );
}
