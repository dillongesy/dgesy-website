"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { Github, Linkedin, Mail } from "lucide-react";

const ThreeOrb = dynamic(() => import("./ThreeOrb"), {
  ssr: false,
  loading: () => <div style={{ width: "640px", height: "640px" }} />,
});

const taglines = [
  "IT Network Engineer",
  "Full Stack Engineer",
  "Mobile App Developer",
  "Cloud Architect",
  "Embedded System Solver",
];

const socials = [
  { icon: Github,   href: "https://github.com/dillongesy",              label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/dillon-gesy",    label: "LinkedIn" },
  { icon: Mail,     href: "mailto:dillon.gesy@yahoo.com",               label: "Email" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

<div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 items-center py-28 lg:py-0 min-h-screen">

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter mb-4 leading-tight text-white"
          >
            Dillon Gesy
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl sm:text-2xl font-light text-slate-400 mb-5 h-9"
          >
            <TypeAnimation
              sequence={taglines.flatMap((t) => [t, 2500])}
              wrapper="span"
              speed={55}
              repeat={Infinity}
              className="text-cyan-400 font-mono"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="max-w-lg text-slate-400 text-base sm:text-lg leading-relaxed mb-9"
          >
            Software and IT engineer based in Iowa. I build things that actually work - mobile apps,
            cloud backends, web portals, and network infrastructure, just to name a few. Iowa State grad, class of 2024.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center gap-4 mb-10"
          >
            <Link
              href="/projects"
              className="px-7 py-3.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              View My Work
            </Link>

            <Link
              href="/contact"
              className="px-7 py-3.5 rounded-xl font-semibold text-sm border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Get in Touch
            </Link>
          </motion.div>

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
                target={label !== "Email" ? "_blank" : undefined}
                rel={label !== "Email" ? "noopener noreferrer" : undefined}
                aria-label={label}
                className="p-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="hidden lg:block"
          style={{ width: "640px", height: "640px" }}
        >
          <ThreeOrb />
        </motion.div>
      </div>
    </section>
  );
}
