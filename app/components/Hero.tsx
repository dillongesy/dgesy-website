"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";
import ParticleCanvas from "./ParticleCanvas";
import { personal } from "../data/portfolio";

// Three.js must be client-only — no SSR
const ThreeOrb = dynamic(() => import("./ThreeOrb"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

// Only show socials that have a non-empty href
const allSocials = [
  { icon: Github,   href: personal.github,                     label: "GitHub" },
  { icon: Linkedin, href: personal.linkedin,                   label: "LinkedIn" },
  { icon: Mail,     href: `mailto:${personal.email}`,          label: "Email" },
];
const socials = allSocials.filter((s) => s.href && s.href !== "mailto:");

export default function Hero() {
  const scrollDown = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Particle background */}
      <ParticleCanvas />

      {/* Radial gradient — shifts left to match text column */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 30% 50%, rgba(99,102,241,0.10) 0%, rgba(6,182,212,0.04) 45%, transparent 70%)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Two-column layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 items-center py-28 lg:py-0 min-h-screen">

        {/* ── Left: Text content ── */}
        <div>
          {/* Name with glitch */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter mb-4 leading-[0.9]"
          >
            <span className="glitch-text gradient-text" data-text={personal.name}>
              {personal.name}
            </span>
          </motion.h1>

          {/* Typewriter subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl sm:text-2xl font-light text-slate-400 mb-5 h-9"
          >
            <TypeAnimation
              sequence={personal.taglines.flatMap((t) => [t, 2500])}
              wrapper="span"
              speed={55}
              repeat={Infinity}
              className="text-cyan-400 font-mono"
            />
          </motion.div>

          {/* Bio */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="max-w-lg text-slate-400 text-base sm:text-lg leading-relaxed mb-9"
          >
            {personal.bio}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center gap-4 mb-10"
          >
            <button
              onClick={() =>
                document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
              }
              className="group relative px-7 py-3.5 rounded-xl font-semibold text-sm overflow-hidden transition-all"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                boxShadow: "0 0 30px rgba(99,102,241,0.35)",
              }}
            >
              <span className="relative z-10 flex items-center gap-2 text-white">
                View My Work
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(135deg, #4f46e5, #0891b2)" }}
              />
            </button>

            <button
              onClick={() =>
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-7 py-3.5 rounded-xl font-semibold text-sm border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Get in Touch
            </button>
          </motion.div>

          {/* Socials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex items-center gap-3"
          >
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </motion.div>
        </div>

        {/* ── Right: 3D Orb (desktop only) ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="hidden lg:flex items-center justify-center h-[480px] w-full"
          style={{
            filter: "drop-shadow(0 0 60px rgba(99,102,241,0.2))",
          }}
        >
          <ThreeOrb />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={scrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-600 hover:text-indigo-400 transition-colors"
        aria-label="Scroll down"
      >
        <span className="text-[10px] font-mono tracking-widest uppercase">scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.button>
    </section>
  );
}
