"use client";

import { motion } from "framer-motion";
import SpotifyNowPlaying from "../components/SpotifyNowPlaying";
import VineBackground from "../components/VineBackground";

export default function ExperimentalLab() {
  return (
    <main className="relative flex-1 overflow-hidden">
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
      </div>
    </main>
  );
}
