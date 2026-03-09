"use client";

import { useRef, useState, type MouseEvent } from "react";
import { motion, useInView } from "framer-motion";
import { Github, ExternalLink, Star } from "lucide-react";
import { projects, type Project } from "../data/portfolio";

function TiltCard({ project, i }: { project: Project; i: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    setTransform(`perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`);
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const onMouseLeave = () => {
    setTransform("rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setGlowPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: i * 0.1 },
        },
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ transform, transition: "transform 0.15s ease-out" }}
      className="group relative rounded-2xl border border-white/[0.07] bg-[#0a0f1e] overflow-hidden cursor-default"
    >
      {/* Gradient glow that follows the cursor */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(99,102,241,0.12) 0%, transparent 60%)`,
        }}
      />

      {/* Top accent bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: "linear-gradient(90deg, #818cf8, #22d3ee, #a78bfa)",
        }}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {project.featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Star size={9} fill="currentColor" />
                Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                onClick={(e) => e.stopPropagation()}
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
            )}
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                onClick={(e) => e.stopPropagation()}
                aria-label="Live demo"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-2">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-5">
          {project.description}
        </p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="projects" ref={ref} className="section-padding px-6">
      <div className="max-w-5xl mx-auto">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            04. Projects
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
        >
          Things I&apos;ve <span className="gradient-text">built</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 mb-12 max-w-xl"
        >
          A selection of projects I&apos;ve built — some are side experiments, some are production systems.
        </motion.p>

        {/* Featured grid */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 gap-5 mb-5"
        >
          {featured.map((p, i) => (
            <TiltCard key={p.title} project={p} i={i} />
          ))}
        </motion.div>

        {/* Other projects */}
        {rest.length > 0 && (
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            {rest.map((p, i) => (
              <TiltCard key={p.title} project={p} i={featured.length + i} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
