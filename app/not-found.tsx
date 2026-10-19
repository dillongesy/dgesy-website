import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FolderGit2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found - Dillon Gesy",
  robots: { index: false },
};

const quickLinks = [
  { href: "/about/", label: "About" },
  { href: "/experience/", label: "Experience" },
  { href: "/contact/", label: "Contact" },
];

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-20">
      <div className="max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-indigo-400 mb-6">
          Error 404 - page not found
        </p>

        <h1
          data-text="Nothing here."
          className="glitch-text text-5xl sm:text-7xl font-black tracking-tighter text-white mb-6"
        >
          Nothing here.
        </h1>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-10">
          This page doesn&apos;t exist. It may have moved, or the link has a typo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back home
          </Link>
          <Link
            href="/projects/"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <FolderGit2 size={16} />
            See my projects
          </Link>
        </div>

        <nav className="flex items-center justify-center gap-6 font-mono text-sm text-slate-500">
          {quickLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-cyan-400 transition-colors">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
