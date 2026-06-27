"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import SpotifyNowPlaying from "../components/SpotifyNowPlaying";
import VineBackground from "../components/VineBackground";
import type { PostMeta } from "../blog/lib";

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ExperimentalLab({ posts }: { posts: PostMeta[] }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated Three.js vine that wanders the screen */}
      <VineBackground />

      {/* Aurora blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute -top-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-emerald-500/10 blur-[120px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-[120px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Readability vignette */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,#020806_95%)]"
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-6 pt-28 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <h1
              className="glitch-text text-6xl sm:text-7xl font-black tracking-tighter text-white"
              data-text="EXPERIMENTAL"
            >
              EXPERIMENTAL
            </h1>
          </div>
        </motion.div>

        {/* Now playing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10"
        >
          <SpotifyNowPlaying />
        </motion.div>

        {/* Journal */}
        <h2 className="mt-16 mb-5 text-xs font-mono uppercase tracking-widest text-emerald-400/80">
          Blog / Journal
        </h2>

        {posts.length === 0 ? (
          <p className="text-slate-500 font-mono text-sm">
            No posts yet. Check back soon.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post, i) => (
              <motion.li
                key={post.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 + i * 0.06 }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-sm p-5 hover:border-emerald-400/25 hover:bg-emerald-400/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mb-2">
                    <CalendarDays size={12} />
                    {formatDate(post.date)}
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-1.5">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
